import { supabaseAdmin } from '@/utils/supabase'
import {
  isExpectedBookingStatus,
  isWaitlistStatus,
  isWalkInSource,
  type AttendanceEventSummary,
  type AttendanceFunnel,
  type AttendanceNoShowDto,
  type AttendanceRecordDto,
  type AttendanceRegistrationSource,
  type AttendanceStats,
  type AttendanceTimelineBucket,
} from '@/lib/attendance-shared'

export type {
  AttendanceEventSummary,
  AttendanceFunnel,
  AttendanceNoShowDto,
  AttendanceRecordDto,
  AttendanceRegistrationSource,
  AttendanceStats,
  AttendanceTimelineBucket,
} from '@/lib/attendance-shared'

export { formatRegistrationSourceLabel } from '@/lib/attendance-shared'

type BookingRow = {
  user_id: string
  status: string | null
  registration_source: AttendanceRegistrationSource
  guest_designation: string | null
  checked_in: boolean | null
  feedback_completed: boolean | null
  users?: { name?: string | null; email?: string | null; role?: string | null } | null
}

function emptyBySource(): AttendanceStats['by_source'] {
  return {
    self: 0,
    walk_in_scan: 0,
    walk_in_guest: 0,
    admin: 0,
    unknown: 0,
  }
}

function bumpSource(
  bySource: AttendanceStats['by_source'],
  source: AttendanceRegistrationSource
) {
  if (source === 'self') bySource.self += 1
  else if (source === 'walk_in_scan') bySource.walk_in_scan += 1
  else if (source === 'walk_in_guest') bySource.walk_in_guest += 1
  else if (source === 'admin') bySource.admin += 1
  else bySource.unknown += 1
}

function buildTimeline(
  successfulTimes: Date[],
  windowStart: Date | null,
  windowEnd: Date | null
): AttendanceTimelineBucket[] {
  if (successfulTimes.length === 0) return []

  const sorted = [...successfulTimes].sort((a, b) => a.getTime() - b.getTime())
  let start = windowStart
  let end = windowEnd

  if (!start || Number.isNaN(start.getTime())) {
    start = new Date(sorted[0].getTime())
    start.setMinutes(Math.floor(start.getMinutes() / 15) * 15, 0, 0)
  }
  if (!end || Number.isNaN(end.getTime())) {
    end = new Date(sorted[sorted.length - 1].getTime())
    end.setMinutes(Math.ceil(end.getMinutes() / 15) * 15, 0, 0)
  }

  // Cap buckets to keep the chart readable
  const spanMs = Math.max(end.getTime() - start.getTime(), 15 * 60 * 1000)
  const bucketMs = spanMs > 6 * 60 * 60 * 1000 ? 30 * 60 * 1000 : 15 * 60 * 1000

  const buckets: AttendanceTimelineBucket[] = []
  for (let t = start.getTime(); t < end.getTime(); t += bucketMs) {
    const bucketStart = new Date(t)
    const bucketEnd = new Date(t + bucketMs)
    const count = sorted.filter(
      (d) => d.getTime() >= bucketStart.getTime() && d.getTime() < bucketEnd.getTime()
    ).length
    buckets.push({
      label: bucketStart.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      start: bucketStart.toISOString(),
      end: bucketEnd.toISOString(),
      count,
    })
  }

  // Include any late scans past window end in a final bucket
  const lastEnd = buckets.length
    ? new Date(buckets[buckets.length - 1].end).getTime()
    : end.getTime()
  const late = sorted.filter((d) => d.getTime() >= lastEnd).length
  if (late > 0) {
    buckets.push({
      label: 'Late',
      start: new Date(lastEnd).toISOString(),
      end: sorted[sorted.length - 1].toISOString(),
      count: late,
    })
  }

  return buckets
}

export async function getEventAttendanceData(eventId: string): Promise<
  | {
      ok: true
      event: AttendanceEventSummary
      records: AttendanceRecordDto[]
      no_shows: AttendanceNoShowDto[]
      stats: AttendanceStats
    }
  | { ok: false; status: number; error: string }
> {
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select(
      `
      id,
      title,
      date,
      start_time,
      end_time,
      qr_attendance_enabled,
      booking_enabled,
      location_id,
      locations:location_id ( name )
    `
    )
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { ok: false, status: 404, error: 'Event not found' }
  }

  const locationName =
    (event as any).locations?.name ||
    (Array.isArray((event as any).locations)
      ? (event as any).locations[0]?.name
      : null) ||
    null

  const { data: qrCodes, error: qrError } = await supabaseAdmin
    .from('event_qr_codes')
    .select('id, scan_window_start, scan_window_end')
    .eq('event_id', eventId)

  if (qrError) {
    console.error('Error fetching QR codes:', qrError)
    return { ok: false, status: 500, error: 'Failed to fetch QR codes' }
  }

  const qrRows = qrCodes || []
  const qrIds = qrRows.map((q) => q.id)
  if (qrIds.length === 0) {
    return { ok: false, status: 404, error: 'No QR code found for this event' }
  }

  const windowStarts = qrRows
    .map((q) => (q.scan_window_start ? new Date(q.scan_window_start) : null))
    .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()))
  const windowEnds = qrRows
    .map((q) => (q.scan_window_end ? new Date(q.scan_window_end) : null))
    .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()))
  const scanWindowStart =
    windowStarts.length > 0
      ? new Date(Math.min(...windowStarts.map((d) => d.getTime()))).toISOString()
      : null
  const scanWindowEnd =
    windowEnds.length > 0
      ? new Date(Math.max(...windowEnds.map((d) => d.getTime()))).toISOString()
      : null

  const eventSummary: AttendanceEventSummary = {
    id: event.id,
    title: event.title,
    date: event.date,
    start_time: event.start_time,
    end_time: event.end_time,
    location_name: locationName,
    qr_attendance_enabled: !!event.qr_attendance_enabled,
    booking_enabled: !!event.booking_enabled,
    scan_window_start: scanWindowStart,
    scan_window_end: scanWindowEnd,
  }

  const { data: scans, error: scansError } = await supabaseAdmin
    .from('qr_code_scans')
    .select(
      `
      id,
      user_id,
      scanned_at,
      scan_success,
      failure_reason,
      users!qr_code_scans_user_id_fkey (
        name,
        email,
        role
      )
    `
    )
    .in('qr_code_id', qrIds)
    .order('scanned_at', { ascending: false })

  if (scansError) {
    console.error('Error fetching scans:', scansError)
    return { ok: false, status: 500, error: 'Failed to fetch attendance records' }
  }

  const { data: bookings, error: bookingsError } = await supabaseAdmin
    .from('event_bookings')
    .select(
      `
      user_id,
      status,
      registration_source,
      guest_designation,
      checked_in,
      feedback_completed,
      users!event_bookings_user_id_fkey (
        name,
        email,
        role
      )
    `
    )
    .eq('event_id', eventId)
    .neq('status', 'cancelled')

  if (bookingsError) {
    console.warn('Failed to load bookings for attendance context:', bookingsError)
  }

  const bookingRows = (bookings || []) as BookingRow[]
  const bookingMap = new Map<string, BookingRow>()
  for (const booking of bookingRows) {
    bookingMap.set(booking.user_id, {
      ...booking,
      registration_source:
        (booking.registration_source as AttendanceRegistrationSource) ?? null,
    })
  }

  const [{ data: feedbackRows }, { data: certificateRows }] = await Promise.all([
    supabaseAdmin
      .from('feedback_responses')
      .select('user_id')
      .eq('event_id', eventId),
    supabaseAdmin.from('certificates').select('user_id').eq('event_id', eventId),
  ])

  const feedbackUsers = new Set(
    (feedbackRows || []).map((r) => r.user_id).filter(Boolean)
  )
  const certificateUsers = new Set(
    (certificateRows || []).map((r) => r.user_id).filter(Boolean)
  )

  const scanRows = scans || []
  const records: AttendanceRecordDto[] = scanRows.map((scan) => {
    const booking = bookingMap.get(scan.user_id)
    const user = scan.users as any
    return {
      id: scan.id,
      user_id: scan.user_id,
      user_name: user?.name || booking?.users?.name || 'Unknown User',
      user_email: user?.email || booking?.users?.email || 'No email',
      scanned_at: scan.scanned_at,
      scan_success: scan.scan_success,
      failure_reason: scan.failure_reason || null,
      booking_status: booking?.status || null,
      registration_source: booking?.registration_source ?? null,
      guest_designation: booking?.guest_designation || null,
      checked_in: booking?.checked_in ?? null,
      user_role: user?.role || booking?.users?.role || null,
      feedback_completed:
        !!booking?.feedback_completed || feedbackUsers.has(scan.user_id),
      has_certificate: certificateUsers.has(scan.user_id),
    }
  })

  const successfulUserIds = new Set(
    scanRows.filter((s) => s.scan_success).map((s) => s.user_id)
  )

  const bySource = emptyBySource()
  const byDesignation: Record<string, number> = {}
  const countedUsers = new Set<string>()
  for (const record of records) {
    if (!record.scan_success || countedUsers.has(record.user_id)) continue
    countedUsers.add(record.user_id)
    bumpSource(bySource, record.registration_source)
    if (record.guest_designation) {
      const key = record.guest_designation
      byDesignation[key] = (byDesignation[key] || 0) + 1
    }
  }

  const expectedBookings = bookingRows.filter(
    (b) =>
      isExpectedBookingStatus(b.status) &&
      !isWalkInSource(b.registration_source)
  )
  const waitlisted = bookingRows.filter((b) => isWaitlistStatus(b.status)).length
  const attended = successfulUserIds.size
  const walkIns = Array.from(successfulUserIds).filter((uid) =>
    isWalkInSource(bookingMap.get(uid)?.registration_source ?? null)
  ).length

  const noShowBookings = expectedBookings.filter(
    (b) => !successfulUserIds.has(b.user_id)
  )
  const no_shows: AttendanceNoShowDto[] = noShowBookings.map((b) => ({
    user_id: b.user_id,
    user_name: b.users?.name || 'Unknown User',
    user_email: b.users?.email || 'No email',
    booking_status: b.status,
    registration_source: b.registration_source ?? null,
    guest_designation: b.guest_designation || null,
  }))

  const booked = expectedBookings.length
  const showRate = booked > 0 ? Math.round((attended / booked) * 100) : 0

  const funnel: AttendanceFunnel = {
    booked,
    waitlisted,
    attended,
    no_shows: no_shows.length,
    walk_ins: walkIns,
    show_rate: showRate,
    feedback_completed: feedbackUsers.size,
    certificates_issued: certificateUsers.size,
  }

  const successfulTimes = scanRows
    .filter((s) => s.scan_success && s.scanned_at)
    .map((s) => new Date(s.scanned_at))
    .filter((d) => !Number.isNaN(d.getTime()))

  const timeline = buildTimeline(
    successfulTimes,
    scanWindowStart ? new Date(scanWindowStart) : null,
    scanWindowEnd ? new Date(scanWindowEnd) : null
  )

  const totalScans = scanRows.length
  const successfulScans = scanRows.filter((s) => s.scan_success).length
  const failedScans = totalScans - successfulScans

  const stats: AttendanceStats = {
    total_scans: totalScans,
    successful_scans: successfulScans,
    failed_scans: failedScans,
    unique_attendees: attended,
    attendance_rate:
      totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 0,
    show_rate: showRate,
    by_source: bySource,
    by_designation: byDesignation,
    funnel,
    timeline,
  }

  return {
    ok: true,
    event: eventSummary,
    records,
    no_shows,
    stats,
  }
}
