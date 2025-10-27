import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('🔄 Starting real-time scan count updates for event:', params.eventId)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.role
    if (!['admin', 'meded_team', 'ctf'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get QR code ID for the event
    const { data: qrCode, error: qrError } = await supabaseAdmin
      .from('event_qr_codes')
      .select('id')
      .eq('event_id', params.eventId)
      .single()

    if (qrError || !qrCode) {
      return NextResponse.json({ 
        error: 'QR code not found for this event' 
      }, { status: 404 })
    }

    // Set up Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        console.log('📡 SSE connection established for event:', params.eventId)
        
        // Send initial scan count and attendees
        sendScanCount(controller, qrCode.id)
        sendAttendees(controller, qrCode.id)
        
        // Set up real-time subscription to scan count changes
        const subscription = supabaseAdmin
          .channel(`qr-scans-${qrCode.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'qr_code_scans',
              filter: `qr_code_id=eq.${qrCode.id}`
            },
            async (payload) => {
              console.log('📊 Scan count changed:', payload)
              await sendScanCount(controller, qrCode.id)
              await sendAttendees(controller, qrCode.id)
            }
          )
          .subscribe()

        // Cleanup function
        const cleanup = () => {
          console.log('🧹 Cleaning up SSE connection for event:', params.eventId)
          subscription.unsubscribe()
          controller.close()
        }

        // Handle client disconnect
        request.signal.addEventListener('abort', cleanup)
        
        // Keep connection alive with periodic ping
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(`data: {"type": "ping", "timestamp": ${Date.now()}}\n\n`)
          } catch (error) {
            console.log('SSE connection closed, stopping ping')
            clearInterval(pingInterval)
            cleanup()
          }
        }, 30000) // Ping every 30 seconds

        // Store cleanup function for later use
        ;(controller as any).cleanup = () => {
          clearInterval(pingInterval)
          cleanup()
        }
      },
      
      cancel() {
        console.log('📡 SSE connection cancelled for event:', params.eventId)
        if ((this as any).cleanup) {
          (this as any).cleanup()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('Error in real-time scan count SSE:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

async function sendScanCount(controller: ReadableStreamDefaultController, qrCodeId: string) {
  try {
    // Get current scan count
    const { count: scanCount, error: scanError } = await supabaseAdmin
      .from('qr_code_scans')
      .select('*', { count: 'exact', head: true })
      .eq('qr_code_id', qrCodeId)
      .eq('scan_success', true)

    if (scanError) {
      console.error('Error fetching scan count:', scanError)
      return
    }

    const data = {
      type: 'scan_count_update',
      scanCount: scanCount || 0,
      timestamp: Date.now()
    }

    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    console.log('📊 Sent scan count update:', scanCount || 0)
    
  } catch (error) {
    console.error('Error sending scan count update:', error)
  }
}

async function sendAttendees(controller: ReadableStreamDefaultController, qrCodeId: string) {
  try {
    // Get current attendees
    const { data: attendees, error: attendeesError } = await supabaseAdmin
      .from('qr_code_scans')
      .select(`
        id,
        scanned_at,
        scan_success,
        users(name)
      `)
      .eq('qr_code_id', qrCodeId)
      .eq('scan_success', true)
      .order('scanned_at', { ascending: false })

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError)
      return
    }

    // Transform the data to match expected format
    const transformedAttendees = (attendees || []).map((attendee: any) => ({
      id: attendee.id,
      user_name: attendee.users?.name || 'Unknown User',
      scanned_at: attendee.scanned_at,
      scan_success: attendee.scan_success
    }))

    const data = {
      type: 'attendees_update',
      attendees: transformedAttendees,
      timestamp: Date.now()
    }

    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    console.log('👥 Sent attendees update:', transformedAttendees?.length || 0)
    
  } catch (error) {
    console.error('Error sending attendees update:', error)
  }
}
