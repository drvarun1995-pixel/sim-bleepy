import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/check/[eventId] - Check if current user has a booking for this event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.eventId;

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an active booking for this event (not cancelled or soft-deleted)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id,
        status,
        booked_at,
        cancelled_at,
        checked_in,
        checked_in_at,
        confirmation_checkbox_1_checked,
        confirmation_checkbox_2_checked
      `)
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .is('deleted_at', null) // Exclude soft-deleted bookings
      .maybeSingle();

    // Check if user scanned QR code for attendance (even if no booking)
    let hasAttended = false;
    let attendedAt: string | null = null;
    
    // If booking exists and is checked in, user attended
    if (booking?.checked_in) {
      hasAttended = true;
      attendedAt = booking.checked_in_at || null;
    } else {
      // Check QR scans for this event and user
      const { data: qrRows } = await supabaseAdmin
        .from('event_qr_codes')
        .select('id')
        .eq('event_id', eventId);

      if (qrRows && qrRows.length > 0) {
        const qrIds = qrRows.map((r: any) => r.id);
        const { data: scans } = await supabaseAdmin
          .from('qr_code_scans')
          .select('scanned_at')
          .in('qr_code_id', qrIds)
          .eq('user_id', user.id)
          .eq('scan_success', true)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (scans) {
          hasAttended = true;
          attendedAt = scans.scanned_at;
        }
      }
    }

    // Update booking status to 'attended' if user scanned QR but booking status isn't 'attended'
    if (hasAttended && booking && booking.status !== 'attended') {
      await supabaseAdmin
        .from('event_bookings')
        .update({ status: 'attended', checked_in: true, checked_in_at: attendedAt || new Date().toISOString() })
        .eq('id', booking.id)
        .then(() => {
          // Refetch booking with updated status
          booking.status = 'attended';
          booking.checked_in = true;
          booking.checked_in_at = attendedAt || new Date().toISOString();
        });
    }

    // Get event details and booking stats
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select(`
        id,
        title,
        date,
        start_time,
        booking_enabled,
        booking_capacity,
        booking_button_label,
        booking_deadline_hours,
        allow_waitlist,
        cancellation_deadline_hours,
        allowed_roles,
        approval_mode,
        confirmation_checkbox_1_text,
        confirmation_checkbox_1_required,
        confirmation_checkbox_2_text,
        confirmation_checkbox_2_required
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get current booking count
    const { data: confirmedBookings, error: countError } = await supabaseAdmin
      .from('event_bookings')
      .select('id')
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    const confirmedCount = confirmedBookings?.length || 0;
    const availableSlots = event.booking_capacity 
      ? Math.max(0, event.booking_capacity - confirmedCount)
      : null;

    // Calculate if booking is still open
    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${event.start_time}`);
    const deadline = new Date(eventDateTime.getTime() - (event.booking_deadline_hours * 60 * 60 * 1000));
    const isBookingOpen = now < deadline;

    // Determine booking availability status
    let bookingAvailability = 'available';
    if (!event.booking_enabled) {
      bookingAvailability = 'disabled';
    } else if (!isBookingOpen) {
      bookingAvailability = 'closed';
    } else if (event.booking_capacity && confirmedCount >= event.booking_capacity) {
      bookingAvailability = event.allow_waitlist ? 'waitlist' : 'full';
    }


    return NextResponse.json({ 
      hasBooking: !!booking,
      booking: booking || (hasAttended ? {
        id: null,
        status: 'attended',
        checked_in: true,
        checked_in_at: attendedAt,
        booked_at: null,
        cancelled_at: null,
        confirmation_checkbox_1_checked: false,
        confirmation_checkbox_2_checked: false
      } : null),
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        start_time: event.start_time,
        booking_enabled: event.booking_enabled,
        booking_capacity: event.booking_capacity,
        booking_button_label: event.booking_button_label,
        allow_waitlist: event.allow_waitlist,
        confirmation_checkbox_1_text: event.confirmation_checkbox_1_text,
        confirmation_checkbox_1_required: event.confirmation_checkbox_1_required,
        confirmation_checkbox_2_text: event.confirmation_checkbox_2_text,
        confirmation_checkbox_2_required: event.confirmation_checkbox_2_required
      },
      availability: {
        status: bookingAvailability,
        confirmedCount,
        availableSlots,
        isBookingOpen,
        deadline: deadline.toISOString()
      }
    });

  } catch (error) {
    console.error('Error in GET /api/bookings/check/[eventId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

