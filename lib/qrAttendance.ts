import { supabaseAdmin } from '@/utils/supabase'
import type { RegistrationSource } from '@/lib/walk-in-shared'

export type QrAttendee = {
  id: string
  user_name: string
  scanned_at: string
  scan_success: boolean
  registration_source?: RegistrationSource | string | null
  guest_designation?: string | null
  user_id?: string | null
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
  const { data: qrMeta } = await supabaseAdmin
    .from('event_qr_codes')
    .select('event_id')
    .eq('id', qrCodeId)
    .maybeSingle()

  const eventId = qrMeta?.event_id as string | undefined

  const { data: attendees, error, count } = await supabaseAdmin
    .from('qr_code_scans')
    .select(
      `
        id,
        scanned_at,
        scan_success,
        user_id,
        booking_id,
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

  const userIds = Array.from(
    new Set((attendees || []).map((a: any) => a.user_id).filter(Boolean))
  ) as string[]

  const bookingByUser = new Map<
    string,
    { registration_source: string | null; guest_designation: string | null }
  >()

  if (eventId && userIds.length > 0) {
    const { data: bookings } = await supabaseAdmin
      .from('event_bookings')
      .select('user_id, registration_source, guest_designation')
      .eq('event_id', eventId)
      .in('user_id', userIds)
      .neq('status', 'cancelled')
      .is('deleted_at', null)

    for (const b of bookings || []) {
      bookingByUser.set(b.user_id, {
        registration_source: b.registration_source || 'self',
        guest_designation: b.guest_designation || null,
      })
    }
  }

  const bookingIds = Array.from(
    new Set((attendees || []).map((a: any) => a.booking_id).filter(Boolean))
  ) as string[]

  if (bookingIds.length > 0) {
    const { data: byId } = await supabaseAdmin
      .from('event_bookings')
      .select('id, user_id, registration_source, guest_designation')
      .in('id', bookingIds)

    for (const b of byId || []) {
      if (b.user_id && !bookingByUser.has(b.user_id)) {
        bookingByUser.set(b.user_id, {
          registration_source: b.registration_source || 'self',
          guest_designation: b.guest_designation || null,
        })
      }
    }
  }

  const transformed: QrAttendee[] = (attendees || []).map((attendee: any) => {
    const meta = attendee.user_id ? bookingByUser.get(attendee.user_id) : undefined
    return {
      id: attendee.id,
      user_id: attendee.user_id,
      user_name: attendee.users?.name || 'Unknown User',
      scanned_at: attendee.scanned_at,
      scan_success: attendee.scan_success,
      registration_source: meta?.registration_source || 'self',
      guest_designation: meta?.guest_designation || null,
    }
  })

  return {
    scanCount: count ?? transformed.length,
    attendees: transformed,
  }
}

export function attendeesFingerprint(attendees: QrAttendee[]): string {
  return attendees
    .map(
      (a) =>
        `${a.id}:${a.scanned_at}:${a.registration_source || ''}:${a.guest_designation || ''}`
    )
    .join('|')
}
