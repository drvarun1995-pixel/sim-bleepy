import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/event/[eventId] - Get all bookings for a specific event (admin only)
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

    // Get user info to check if admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = ['admin', 'meded_team', 'ctf', 'educator'].includes(user.role);

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Access denied. Only admins can view event bookings.' 
      }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    // Fetch all bookings for this event (simplified)
    let query = supabaseAdmin
      .from('event_bookings')
      .select('id, event_id, user_id, status, booked_at, checked_in, cancellation_reason')
      .eq('event_id', eventId)
      .order('booked_at', { ascending: false });

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching event bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events_with_details')
      .select(`
        id,
        title,
        date,
        start_time,
        end_time,
        booking_enabled,
        booking_capacity,
        booking_button_label,
        booking_deadline_hours,
        allow_waitlist,
        location_name,
        location_address
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch user data separately if we have bookings
    let bookingsWithUsers = bookings || [];
    if (bookings && bookings.length > 0) {
      const userIds = bookings.map(b => b.user_id);
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        // Return bookings without user details
      } else {
        // Attach user data to bookings
        bookingsWithUsers = bookings.map(booking => ({
          ...booking,
          users: users.find(u => u.id === booking.user_id)
        }));
      }
    }

    // Calculate summary statistics
    const summary = {
      total: bookings?.length || 0,
      confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
      waitlist: bookings?.filter(b => b.status === 'waitlist').length || 0,
      cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
      attended: bookings?.filter(b => b.status === 'attended').length || 0,
      noShow: bookings?.filter(b => b.status === 'no-show').length || 0,
      checkedIn: bookings?.filter(b => b.checked_in).length || 0,
      capacity: event.booking_capacity,
      availableSlots: event.booking_capacity 
        ? Math.max(0, event.booking_capacity - (bookings?.filter(b => b.status === 'confirmed').length || 0))
        : null
    };

    return NextResponse.json({ 
      bookings: bookingsWithUsers,
      event,
      summary
    });

  } catch (error) {
    console.error('Error in GET /api/bookings/event/[eventId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

