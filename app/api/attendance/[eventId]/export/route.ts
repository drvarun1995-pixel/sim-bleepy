import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import {
  formatRegistrationSourceLabel,
  getEventAttendanceData,
} from '@/lib/attendance-records'

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

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const result = await getEventAttendanceData(params.eventId)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { event, records, no_shows, stats } = result

    const csvHeaders = [
      'User Name',
      'User Email',
      'Scanned At',
      'Scan Success',
      'Failure Reason',
      'Booking Status',
      'Registration Source',
      'Guest Designation',
      'Role',
      'Feedback Completed',
      'Certificate Issued',
    ]

    const csvRows = records.map((record) => [
      record.user_name,
      record.user_email,
      new Date(record.scanned_at).toLocaleString('en-GB'),
      record.scan_success ? 'Yes' : 'No',
      record.failure_reason || '',
      record.booking_status || 'N/A',
      formatRegistrationSourceLabel(record.registration_source),
      record.guest_designation || '',
      record.user_role || '',
      record.feedback_completed ? 'Yes' : 'No',
      record.has_certificate ? 'Yes' : 'No',
    ])

    const noShowHeaders = [
      '',
      'NO SHOWS',
      'User Name',
      'User Email',
      'Booking Status',
      'Registration Source',
    ]
    const noShowRows = no_shows.map((row) => [
      '',
      '',
      row.user_name,
      row.user_email,
      row.booking_status || 'N/A',
      formatRegistrationSourceLabel(row.registration_source),
    ])

    const summaryRows = [
      [''],
      ['SUMMARY STATISTICS'],
      ['Total Scans', stats.total_scans],
      ['Successful Scans', stats.successful_scans],
      ['Failed Scans', stats.failed_scans],
      ['Unique Attendees', stats.unique_attendees],
      ['Scan Success Rate', `${stats.attendance_rate}%`],
      ['Show Rate (booked)', `${stats.show_rate}%`],
      ['Booked expected', stats.funnel.booked],
      ['No shows', stats.funnel.no_shows],
      ['Walk-ins attended', stats.funnel.walk_ins],
      ['Waitlisted', stats.funnel.waitlisted],
      ['Feedback completed', stats.funnel.feedback_completed],
      ['Certificates issued', stats.funnel.certificates_issued],
      ['Booked (self)', stats.by_source.self],
      ['Walk-in signed in', stats.by_source.walk_in_scan],
      ['Walk-in guest', stats.by_source.walk_in_guest],
      ['Added by staff', stats.by_source.admin],
      ['Unknown source', stats.by_source.unknown],
      [''],
      ['EVENT DETAILS'],
      ['Event Title', event.title],
      ['Event Date', event.date],
      ['Event Time', `${event.start_time || ''} - ${event.end_time || ''}`],
      ['Location', event.location_name || ''],
      ['Export Date', new Date().toLocaleString('en-GB')],
    ]

    const allRows = [
      csvHeaders,
      ...csvRows,
      noShowHeaders,
      ...noShowRows,
      ...summaryRows,
    ]
    const csvContent = allRows
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')

    console.log('✅ Attendance data exported successfully:', {
      eventId: params.eventId,
      totalRecords: records.length,
    })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${event.date}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/attendance/[eventId]/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
