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

    // Check if user has an active booking for this event (not cancelled)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id,
        status,
        booked_at,
        cancelled_at,
        checked_in,
        confirmation_checkbox_1_checked,
        confirmation_notes
      `)
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .maybeSingle();

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
        allow_waitlist
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
      booking: booking || null,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        start_time: event.start_time,
        booking_enabled: event.booking_enabled,
        booking_capacity: event.booking_capacity,
        booking_button_label: event.booking_button_label,
        allow_waitlist: event.allow_waitlist
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

