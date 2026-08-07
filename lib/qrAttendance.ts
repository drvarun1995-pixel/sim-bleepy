import { supabaseAdmin } from '@/utils/supabase'

export type QrAttendee = {
  id: string
  user_name: string
  scanned_at: string
  scan_success: boolean
}

export async function getLatestQrCodeIdForEvent(eventId: string): Promise<string | null> {
  const { data: rows, error } = await supabaseAdmin
    .from('event_qr_codes')
    .select('id')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !rows?.length) {
    return null
  }

  return rows[0].id
}

export async function fetchQrAttendance(
  qrCodeId: string
): Promise<{ scanCount: number; attendees: QrAttendee[] }> {
  const { data: attendees, error, count } = await supabaseAdmin
    .from('qr_code_scans')
    .select(
      `
        id,
        scanned_at,
        scan_success,
        users(name)
      `,
      { count: 'exact' }
    )
    .eq('qr_code_id', qrCodeId)
    .eq('scan_success', true)
    .order('scanned_at', { ascending: false })

  if (error) {
    throw error
  }

  const transformed: QrAttendee[] = (attendees || []).map((attendee: any) => ({
    id: attendee.id,
    user_name: attendee.users?.name || 'Unknown User',
    scanned_at: attendee.scanned_at,
    scan_success: attendee.scan_success,
  }))

  return {
    scanCount: count ?? transformed.length,
    attendees: transformed,
  }
}

export function attendeesFingerprint(attendees: QrAttendee[]): string {
  return attendees.map((a) => `${a.id}:${a.scanned_at}`).join('|')
}
