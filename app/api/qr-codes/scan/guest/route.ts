import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import {
  consumeSoftRateLimit,
  getClientIp,
  ipRateKey,
} from '@/lib/auth-rate-limit'
import {
  findOrCreateWalkInGuestUser,
  isEventAtCapacity,
  resolveGuestDesignation,
} from '@/lib/walk-in'
import { WALK_IN_DESIGNATION_OPTIONS } from '@/lib/walk-in-shared'
import { runAttendanceSideEffects } from '@/lib/qr-scan-attendance'

const GUEST_SCAN_SOFT_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxAttempts: 12,
  lockoutMs: 15 * 60 * 1000,
}

async function getActiveQrForEvent(eventId: string) {
  const { data: qrRows, error } = await supabaseAdmin
    .from('event_qr_codes')
    .select(`
      id, event_id, active, scan_window_start, scan_window_end,
      events (
        id, title, date, start_time, end_time
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return Array.isArray(qrRows) ? qrRows[0] : null
}

/** Public: whether guest walk-in form should be shown for this event QR */
export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get('eventId')
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('id, title, date, allow_walk_in_registration, booking_capacity, qr_attendance_enabled')
      .eq('id', eventId)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      allowWalkInRegistration: !!event.allow_walk_in_registration,
      qrAttendanceEnabled: !!event.qr_attendance_enabled,
      designationOptions: WALK_IN_DESIGNATION_OPTIONS,
    })
  } catch (error) {
    console.error('Error in GET /api/qr-codes/scan/guest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rate = consumeSoftRateLimit(ipRateKey(ip, 'guest-walk-in'), GUEST_SCAN_SOFT_LIMIT)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many check-in attempts. Please try again later.' },
        {
          status: 429,
          headers: rate.retryAfterSeconds
            ? { 'Retry-After': String(rate.retryAfterSeconds) }
            : undefined,
        }
      )
    }

    const body = await request.json()
    const eventId = (body.eventId || '').trim()
    const name = (body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const designationKey = (body.designationKey || body.designation || '').trim()
    const designationOther = (body.designationOther || '').trim()

    if (!eventId || !name || !email) {
      return NextResponse.json(
        { error: 'Name, email, and event are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    let designationResolved: { designation: string; roleType: string | null }
    try {
      designationResolved = resolveGuestDesignation(designationKey, designationOther)
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Designation is required' }, { status: 400 })
    }

    const { data: eventFlags, error: eventError } = await supabaseAdmin
      .from('events')
      .select(
        'id, title, date, start_time, end_time, booking_enabled, qr_attendance_enabled, allow_walk_in_registration, booking_capacity, feedback_enabled, auto_generate_certificate, certificate_template_id, feedback_required_for_certificate'
      )
      .eq('id', eventId)
      .single()

    if (eventError || !eventFlags) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!eventFlags.allow_walk_in_registration) {
      return NextResponse.json(
        { error: 'Walk-in registration is not enabled for this event. Please sign in to check in.' },
        { status: 403 }
      )
    }

    const qrCode = await getActiveQrForEvent(eventId)
    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
    }
    if (!qrCode.active) {
      return NextResponse.json({ error: 'QR code is inactive' }, { status: 400 })
    }

    const now = new Date()
    const scanStart = new Date(qrCode.scan_window_start)
    const scanEnd = new Date(qrCode.scan_window_end)

    if (now < scanStart) {
      return NextResponse.json(
        {
          error: 'QR code scanning is not yet active',
          details: { scanWindowStart: scanStart.toISOString() },
        },
        { status: 400 }
      )
    }
    if (now > scanEnd) {
      return NextResponse.json(
        {
          error: 'QR code scanning has expired',
          details: { scanWindowEnd: scanEnd.toISOString() },
        },
        { status: 400 }
      )
    }

    const { user } = await findOrCreateWalkInGuestUser({
      name,
      email,
      roleType: designationResolved.roleType,
    })

    const { data: existingBooking } = await supabaseAdmin
      .from('event_bookings')
      .select('id, status, checked_in, checked_in_at, registration_source, guest_designation')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .is('deleted_at', null)
      .maybeSingle()

    if (existingBooking?.checked_in) {
      return NextResponse.json({
        success: true,
        message: 'Attendance already marked for this event',
        details: {
          eventTitle: eventFlags.title,
          eventDate: eventFlags.date,
          checkedInAt: existingBooking.checked_in_at,
          registrationSource: existingBooking.registration_source || 'walk_in_guest',
          guestDesignation: existingBooking.guest_designation,
          duplicate: true,
          isGuest: true,
        },
      })
    }

    const { data: existingScan } = await supabaseAdmin
      .from('qr_code_scans')
      .select('id, scanned_at')
      .eq('qr_code_id', qrCode.id)
      .eq('user_id', user.id)
      .eq('scan_success', true)
      .order('scanned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingScan) {
      return NextResponse.json({
        success: true,
        message: 'Attendance already marked for this event',
        details: {
          eventTitle: eventFlags.title,
          eventDate: eventFlags.date,
          checkedInAt: existingScan.scanned_at,
          registrationSource: 'walk_in_guest',
          guestDesignation: designationResolved.designation,
          duplicate: true,
          isGuest: true,
        },
      })
    }

    if (!existingBooking) {
      const atCapacity = await isEventAtCapacity(eventId, eventFlags.booking_capacity)
      if (atCapacity) {
        return NextResponse.json(
          { error: 'This event is full. Please ask a member of staff to add you.' },
          { status: 403 }
        )
      }
    }

    let bookingId = existingBooking?.id || null

    if (existingBooking) {
      const { error: updateError } = await supabaseAdmin
        .from('event_bookings')
        .update({
          checked_in: true,
          checked_in_at: now.toISOString(),
          status: 'attended',
          guest_designation: designationResolved.designation,
          registration_source: existingBooking.registration_source || 'walk_in_guest',
        })
        .eq('id', existingBooking.id)

      if (updateError) {
        console.error('Failed to update guest booking:', updateError)
        return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
      }
    } else {
      const { data: newBooking, error: createError } = await supabaseAdmin
        .from('event_bookings')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'attended',
          checked_in: true,
          checked_in_at: now.toISOString(),
          registration_source: 'walk_in_guest',
          guest_designation: designationResolved.designation,
          confirmation_checkbox_1_checked: false,
          confirmation_checkbox_2_checked: false,
        })
        .select('id')
        .single()

      if (createError || !newBooking) {
        console.error('Failed to create guest booking:', createError)
        return NextResponse.json({ error: 'Failed to register walk-in attendance' }, { status: 500 })
      }
      bookingId = newBooking.id
    }

    const { error: scanLogError } = await supabaseAdmin.from('qr_code_scans').insert({
      qr_code_id: qrCode.id,
      user_id: user.id,
      booking_id: bookingId,
      scanned_at: now.toISOString(),
      scan_success: true,
    })

    if (scanLogError && (scanLogError as any)?.code !== '23505') {
      console.error('Failed to log guest scan:', scanLogError)
    }

    const { feedbackEmailSent } = await runAttendanceSideEffects({
      user: { id: user.id, name: user.name || name, email: user.email },
      targetEventId: eventId,
      eventFlags,
      eventDetails: {
        title: eventFlags.title,
        date: eventFlags.date,
        start_time: eventFlags.start_time,
        end_time: eventFlags.end_time,
      },
      now,
      isGuest: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Checked in as guest successfully',
      details: {
        eventTitle: eventFlags.title,
        eventDate: eventFlags.date,
        checkedInAt: now.toISOString(),
        registrationSource: 'walk_in_guest',
        guestDesignation: designationResolved.designation,
        isGuest: true,
        feedbackEmailSent,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/qr-codes/scan/guest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
