import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function PUT(request: NextRequest) {
  try {
    console.log('📝 Updating QR code scan window')
    
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

    const body = await request.json()
    const { eventId, scanWindowStart, scanWindowEnd } = body

    if (!eventId || !scanWindowStart || !scanWindowEnd) {
      return NextResponse.json({ 
        error: 'Missing required fields: eventId, scanWindowStart, scanWindowEnd' 
      }, { status: 400 })
    }

    // Validate dates
    const startDate = new Date(scanWindowStart)
    const endDate = new Date(scanWindowEnd)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format' 
      }, { status: 400 })
    }

    if (startDate >= endDate) {
      return NextResponse.json({ 
        error: 'Scan window start must be before scan window end' 
      }, { status: 400 })
    }

    // Update QR code scan window
    const { data: qrCode, error: updateError } = await supabaseAdmin
      .from('event_qr_codes')
      .update({
        scan_window_start: startDate.toISOString(),
        scan_window_end: endDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating QR code:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update QR code' 
      }, { status: 500 })
    }

    console.log('✅ QR code scan window updated successfully:', qrCode.id)

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        eventId: qrCode.event_id,
        qrCodeImageUrl: qrCode.qr_code_image_url,
        scanWindowStart: qrCode.scan_window_start,
        scanWindowEnd: qrCode.scan_window_end,
        active: qrCode.active,
        scanCount: 0, // This would need to be fetched separately if needed
        createdAt: qrCode.created_at,
        updatedAt: qrCode.updated_at
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/qr-codes/update:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

