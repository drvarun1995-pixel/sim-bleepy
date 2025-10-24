import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('📱 Getting QR code for event:', params.eventId)
    
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

    // Get QR code for the event
    const { data: qrCode, error: qrError } = await supabaseAdmin
      .from('event_qr_codes')
      .select(`
        id, event_id, qr_code_data, qr_code_image_url, active,
        scan_window_start, scan_window_end, created_at, updated_at
      `)
      .eq('event_id', params.eventId)
      .single()

    if (qrError) {
      if (qrError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'QR code not found for this event' 
        }, { status: 404 })
      }
      console.error('Error fetching QR code:', qrError)
      return NextResponse.json({ 
        error: 'Failed to fetch QR code' 
      }, { status: 500 })
    }

    // Get scan count
    const { count: scanCount, error: scanError } = await supabaseAdmin
      .from('qr_code_scans')
      .select('*', { count: 'exact', head: true })
      .eq('qr_code_id', qrCode.id)
      .eq('scan_success', true)

    if (scanError) {
      console.error('Error fetching scan count:', scanError)
    }

    console.log('✅ QR code retrieved successfully:', qrCode.id)
    console.log('📅 Scan window start from DB:', qrCode.scan_window_start)
    console.log('📅 Scan window end from DB:', qrCode.scan_window_end)

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        eventId: qrCode.event_id,
        qrCodeImageUrl: qrCode.qr_code_image_url,
        scanWindowStart: qrCode.scan_window_start,
        scanWindowEnd: qrCode.scan_window_end,
        active: qrCode.active,
        scanCount: scanCount || 0,
        createdAt: qrCode.created_at,
        updatedAt: qrCode.updated_at
      }
    })

  } catch (error) {
    console.error('Error in GET /api/qr-codes/[eventId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('🗑️ Deactivating QR code for event:', params.eventId)
    
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
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
    }

    // Deactivate QR code
    const { error: updateError } = await supabaseAdmin
      .from('event_qr_codes')
      .update({ active: false })
      .eq('event_id', params.eventId)

    if (updateError) {
      console.error('Error deactivating QR code:', updateError)
      return NextResponse.json({ 
        error: 'Failed to deactivate QR code' 
      }, { status: 500 })
    }

    console.log('✅ QR code deactivated successfully for event:', params.eventId)

    return NextResponse.json({
      success: true,
      message: 'QR code deactivated successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/qr-codes/[eventId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

