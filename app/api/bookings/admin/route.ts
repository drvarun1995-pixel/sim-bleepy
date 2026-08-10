import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { isEventAtCapacity } from '@/lib/walk-in'

/**
 * POST /api/bookings/admin — staff add attendee by email (walk-in / paper list)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: staff, error: staffError } = await supabaseAdmin
      .from('users')
      .select('id, role, email, name')
      .eq('email', session.user.email)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'meded_team', 'ctf', 'educator'].includes(staff.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const eventId = (body.eventId || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const markAttended = !!body.markAttended
    const overrideNote = (body.overrideNote || '').trim()

    if (!eventId || !email) {
      return NextResponse.json({ error: 'eventId and email are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title, booking_capacity, allow_walk_in_registration, booking_enabled')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('email', email)
      .maybeSingle()

    if (targetError) {
      return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 })
    }

    if (!targetUser) {
      return NextResponse.json(
        {
          error:
            'No Bleepy account found for that email. Ask them to sign up, or use guest walk-in check-in at the door.',
        },
        { status: 404 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('event_bookings')
      .select('id, status, checked_in')
      .eq('event_id', eventId)
      .eq('user_id', targetUser.id)
      .neq('status', 'cancelled')
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      if (markAttended && !existing.checked_in) {
        const now = new Date().toISOString()
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('event_bookings')
          .update({
            status: 'attended',
            checked_in: true,
            checked_in_at: now,
          })
          .eq('id', existing.id)
          .select('id, status, checked_in, checked_in_at, registration_source')
          .single()

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'Existing booking marked as attended',
          booking: updated,
        })
      }

      return NextResponse.json(
        { error: 'This user already has a booking for this event', bookingId: existing.id },
        { status: 409 }
      )
    }

    const atCapacity = await isEventAtCapacity(eventId, event.booking_capacity)
    if (atCapacity && !overrideNote) {
      return NextResponse.json(
        {
          error: 'Event is at capacity. Provide an override note to add this attendee.',
          requiresOverride: true,
        },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const insertPayload: Record<string, unknown> = {
      event_id: eventId,
      user_id: targetUser.id,
      status: markAttended ? 'attended' : 'confirmed',
      checked_in: markAttended,
      checked_in_at: markAttended ? now : null,
      registration_source: 'admin',
      confirmation_checkbox_1_checked: false,
      confirmation_checkbox_2_checked: false,
      notes: overrideNote
        ? `Capacity override by ${staff.email}: ${overrideNote}`
        : `Added by staff (${staff.email})`,
      capacity_override_note: atCapacity ? overrideNote : null,
    }

    const { data: booking, error: createError } = await supabaseAdmin
      .from('event_bookings')
      .insert(insertPayload)
      .select(
        `
        id, status, booked_at, checked_in, checked_in_at, registration_source, capacity_override_note,
        users:user_id ( id, name, email, role )
      `
      )
      .single()

    if (createError || !booking) {
      console.error('Admin add booking failed:', createError)
      return NextResponse.json(
        { error: 'Failed to create booking', details: createError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: markAttended ? 'Attendee added and marked present' : 'Attendee added',
      booking,
      overCapacity: atCapacity,
    })
  } catch (error) {
    console.error('Error in POST /api/bookings/admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
