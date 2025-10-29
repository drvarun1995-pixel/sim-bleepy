import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('📊 Getting attendance data for event:', params.eventId)
    
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
      .select('id')
      .eq('event_id', params.eventId)
      .single()

    if (qrError || !qrCode) {
      return NextResponse.json({ 
        error: 'No QR code found for this event' 
      }, { status: 404 })
    }

    // Get attendance records (QR code scans)
    const { data: scans, error: scansError } = await supabaseAdmin
      .from('qr_code_scans')
      .select(`
        id,
        user_id,
        scanned_at,
        scan_success,
        failure_reason,
        users!qr_code_scans_user_id_fkey (
          name,
          email
        )
      `)
      .eq('qr_code_id', qrCode.id)
      .order('scanned_at', { ascending: false })

    if (scansError) {
      console.error('Error fetching scans:', scansError)
      return NextResponse.json({ 
        error: 'Failed to fetch attendance records' 
      }, { status: 500 })
    }

    // Get booking data for context (optional)
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        user_id,
        status,
        users!event_bookings_user_id_fkey (
          name,
          email
        )
      `)
      .eq('event_id', params.eventId)

    // Create a map of user bookings for context
    const bookingMap = new Map()
    if (bookings && !bookingsError) {
      bookings.forEach(booking => {
        bookingMap.set(booking.user_id, booking.status)
      })
    }

    // Transform scans data
    const records = scans.map(scan => ({
      id: scan.id,
      user_id: scan.user_id,
      user_name: scan.users?.name || 'Unknown User',
      user_email: scan.users?.email || 'No email',
      scanned_at: scan.scanned_at,
      scan_success: scan.scan_success,
      failure_reason: scan.failure_reason,
      booking_status: bookingMap.get(scan.user_id) || null
    }))

    // Calculate statistics
    const totalScans = scans.length
    const successfulScans = scans.filter(scan => scan.scan_success).length
    const failedScans = scans.filter(scan => !scan.scan_success).length
    const uniqueAttendees = new Set(scans.map(scan => scan.user_id)).size

    const stats = {
      total_scans: totalScans,
      successful_scans: successfulScans,
      failed_scans: failedScans,
      unique_attendees: uniqueAttendees,
      attendance_rate: totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 0
    }

    console.log('✅ Attendance data retrieved successfully:', {
      eventId: params.eventId,
      totalRecords: records.length,
      stats
    })

    return NextResponse.json({
      success: true,
      records,
      stats
    })

  } catch (error) {
    console.error('Error in GET /api/attendance/[eventId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
