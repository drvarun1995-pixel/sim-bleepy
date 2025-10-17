import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * TEST /api/bookings/test - Test the exact same logic as the main route
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info to check role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found', details: userError }, { status: 404 });
    }

    const isAdmin = ['admin', 'meded_team', 'ctf', 'educator'].includes(user.role);

    // First try a simple query without joins
    let query = supabaseAdmin
      .from('event_bookings')
      .select(`
        id,
        event_id,
        user_id,
        status,
        booked_at,
        cancelled_at,
        cancellation,
        checked_in,
        checked_in_at,
        confirmation_checkbox_1_checked,
        confirmation_notes,
        notes,
        deleted_at,
        deleted_by,
        created_at,
        updated_at
      `)
      .order('booked_at', { ascending: false });

    // If not admin, only show user's own bookings
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings', details: error }, { status: 500 });
    }

    // If we have bookings, fetch event details separately
    if (bookings && bookings.length > 0) {
      const eventIds = bookings.map(b => b.event_id);
      const { data: events, error: eventsError } = await supabaseAdmin
        .from('events')
        .select('id, title, date, start_time, end_time, booking_capacity, booking_enabled')
        .in('id', eventIds);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        // Return bookings without event details
        return NextResponse.json({ bookings });
      }

      // Attach event data to bookings
      const bookingsWithEvents = bookings.map(booking => ({
        ...booking,
        event: events.find(e => e.id === booking.event_id)
      }));

      return NextResponse.json({ 
        success: true,
        user: { id: user.id, role: user.role },
        bookings: bookingsWithEvents,
        count: bookingsWithEvents.length
      });
    }

    return NextResponse.json({ 
      success: true,
      user: { id: user.id, role: user.role },
      bookings: [],
      count: 0
    });

  } catch (error) {
    console.error('Error in TEST /api/bookings/test:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
