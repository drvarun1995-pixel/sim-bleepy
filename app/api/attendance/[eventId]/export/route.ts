import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as XLSX from 'xlsx'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import {
  formatRegistrationSourceLabel,
  getEventAttendanceData,
} from '@/lib/attendance-records'

function sheetFromAoA(headers: string[], rows: Array<Array<string | number>>) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows.length ? [headers, ...rows] : [headers])
  worksheet['!cols'] = headers.map((header, index) => {
    const sample = rows.reduce((longest, row) => {
      return Math.max(longest, String(row[index] ?? '').length)
    }, header.length)
    return { wch: Math.min(60, Math.max(14, sample + 2)) }
  })
  return worksheet
}

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

    const scanRows = records.map((record) => [
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

    const noShowRows = no_shows.map((row) => [
      row.user_name,
      row.user_email,
      row.booking_status || 'N/A',
      formatRegistrationSourceLabel(row.registration_source),
    ])

    const summaryRows: Array<Array<string | number>> = [
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
      ['Event Title', event.title],
      ['Event Date', event.date],
      ['Event Time', `${event.start_time || ''} - ${event.end_time || ''}`],
      ['Location', event.location_name || ''],
      ['Export Date', new Date().toLocaleString('en-GB')],
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      sheetFromAoA(
        [
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
        ],
        scanRows
      ),
      'Scans'
    )
    XLSX.utils.book_append_sheet(
      workbook,
      sheetFromAoA(
        ['User Name', 'User Email', 'Booking Status', 'Registration Source'],
        noShowRows
      ),
      'No shows'
    )
    XLSX.utils.book_append_sheet(workbook, sheetFromAoA(['Metric', 'Value'], summaryRows), 'Summary')

    const filename = `attendance-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${event.date}.xlsx`
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    console.log('✅ Attendance data exported successfully:', {
      eventId: params.eventId,
      totalRecords: records.length,
    })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/attendance/[eventId]/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
