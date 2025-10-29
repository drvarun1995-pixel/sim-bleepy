import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('📊 Exporting attendance data for event:', params.eventId)
    
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

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('title, date, start_time, end_time')
      .eq('id', params.eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 })
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

    // Get booking data for context
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

    // Create CSV content
    const csvHeaders = [
      'User Name',
      'User Email',
      'Scanned At',
      'Scan Success',
      'Failure Reason',
      'Booking Status'
    ]

    const csvRows = scans.map(scan => [
      (scan.users as any)?.name || 'Unknown User',
      (scan.users as any)?.email || 'No email',
      new Date(scan.scanned_at).toLocaleString('en-GB'),
      scan.scan_success ? 'Yes' : 'No',
      scan.failure_reason || '',
      bookingMap.get(scan.user_id) || 'N/A'
    ])

    // Add summary statistics
    const totalScans = scans.length
    const successfulScans = scans.filter(scan => scan.scan_success).length
    const failedScans = scans.filter(scan => !scan.scan_success).length
    const uniqueAttendees = new Set(scans.map(scan => scan.user_id)).size

    const summaryRows = [
      [''],
      ['SUMMARY STATISTICS'],
      ['Total Scans', totalScans],
      ['Successful Scans', successfulScans],
      ['Failed Scans', failedScans],
      ['Unique Attendees', uniqueAttendees],
      ['Success Rate', totalScans > 0 ? `${Math.round((successfulScans / totalScans) * 100)}%` : '0%'],
      [''],
      ['EVENT DETAILS'],
      ['Event Title', event.title],
      ['Event Date', event.date],
      ['Event Time', `${event.start_time} - ${event.end_time}`],
      ['Export Date', new Date().toLocaleString('en-GB')]
    ]

    // Combine all rows
    const allRows = [
      csvHeaders,
      ...csvRows,
      ...summaryRows
    ]

    // Convert to CSV
    const csvContent = allRows.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    console.log('✅ Attendance data exported successfully:', {
      eventId: params.eventId,
      totalRecords: scans.length
    })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${event.date}.csv"`
      }
    })

  } catch (error) {
    console.error('Error in GET /api/attendance/[eventId]/export:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
