import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { qrCodeId: string } }
) {
  try {
    console.log('👥 Getting attendees for QR code:', params.qrCodeId)
    console.log('👥 QR code ID type:', typeof params.qrCodeId)
    console.log('👥 QR code ID length:', params.qrCodeId?.length)
    
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

    // Get attendees who scanned this QR code
    console.log('👥 Querying qr_code_scans table with qr_code_id:', params.qrCodeId)
    
    const { data: attendees, error: attendeesError } = await supabaseAdmin
      .from('qr_code_scans')
      .select(`
        id,
        scanned_at,
        scan_success,
        users(name)
      `)
      .eq('qr_code_id', params.qrCodeId)
      .eq('scan_success', true)
      .order('scanned_at', { ascending: false })

    console.log('👥 Database query result:', { attendees, attendeesError })

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError)
      return NextResponse.json({ 
        error: 'Failed to fetch attendees',
        details: attendeesError.message 
      }, { status: 500 })
    }

    console.log('✅ Attendees retrieved successfully:', attendees?.length || 0)
    console.log('🔍 Raw attendees data:', JSON.stringify(attendees, null, 2))

    // Transform the data to match expected format
    const transformedAttendees = (attendees || []).map((attendee: any) => ({
      id: attendee.id,
      user_name: attendee.users?.name || 'Unknown User',
      scanned_at: attendee.scanned_at,
      scan_success: attendee.scan_success
    }))

    return NextResponse.json({
      success: true,
      attendees: transformedAttendees,
      debug: {
        qrCodeId: params.qrCodeId,
        totalScans: attendees?.length || 0,
        rawData: attendees
      }
    })

  } catch (error) {
    console.error('Error in GET /api/qr-codes/attendees/[qrCodeId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
