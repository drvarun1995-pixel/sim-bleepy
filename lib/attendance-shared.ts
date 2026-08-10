export type AttendanceRegistrationSource =
  | 'self'
  | 'walk_in_scan'
  | 'walk_in_guest'
  | 'admin'
  | null

export type AttendanceRecordDto = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  scanned_at: string
  scan_success: boolean
  failure_reason: string | null
  booking_status: string | null
  registration_source: AttendanceRegistrationSource
  guest_designation: string | null
  checked_in: boolean | null
  user_role: string | null
  feedback_completed: boolean
  has_certificate: boolean
}

export type AttendanceNoShowDto = {
  user_id: string
  user_name: string
  user_email: string
  booking_status: string | null
  registration_source: AttendanceRegistrationSource
  guest_designation: string | null
}

export type AttendanceEventSummary = {
  id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  location_name: string | null
  qr_attendance_enabled: boolean
  booking_enabled: boolean
  scan_window_start: string | null
  scan_window_end: string | null
}

export type AttendanceFunnel = {
  booked: number
  waitlisted: number
  attended: number
  no_shows: number
  walk_ins: number
  show_rate: number
  feedback_completed: number
  certificates_issued: number
}

export type AttendanceTimelineBucket = {
  label: string
  start: string
  end: string
  count: number
}

export type AttendanceStats = {
  total_scans: number
  successful_scans: number
  failed_scans: number
  unique_attendees: number
  /** Successful scan rate among all scans */
  attendance_rate: number
  /** Attended / expected booked (excludes waitlist/cancelled) */
  show_rate: number
  by_source: {
    self: number
    walk_in_scan: number
    walk_in_guest: number
    admin: number
    unknown: number
  }
  by_designation: Record<string, number>
  funnel: AttendanceFunnel
  timeline: AttendanceTimelineBucket[]
}

export function formatRegistrationSourceLabel(
  source: AttendanceRegistrationSource
): string {
  switch (source) {
    case 'self':
      return 'Booked'
    case 'walk_in_scan':
      return 'Walk-in (signed in)'
    case 'walk_in_guest':
      return 'Walk-in guest'
    case 'admin':
      return 'Added by staff'
    default:
      return 'Unknown'
  }
}

export function isExpectedBookingStatus(status: string | null | undefined): boolean {
  if (!status) return false
  const s = status.toLowerCase()
  return !['cancelled', 'waitlist', 'rejected', 'declined'].includes(s)
}

export function isWaitlistStatus(status: string | null | undefined): boolean {
  return (status || '').toLowerCase() === 'waitlist'
}

export function isWalkInSource(source: AttendanceRegistrationSource): boolean {
  return source === 'walk_in_guest' || source === 'walk_in_scan'
}
