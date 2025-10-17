import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/stats - Get booking statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        error: 'Access denied. Only admins can view booking statistics.' 
      }, { status: 403 });
    }

    // Fetch from event_booking_stats view
    const { data: stats, error } = await supabaseAdmin
      .from('event_booking_stats')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching booking stats:', error);
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    // Calculate overall statistics
    const overallStats = {
      totalEventsWithBooking: stats?.length || 0,
      totalConfirmedBookings: stats?.reduce((sum, s) => sum + (s.confirmed_count || 0), 0) || 0,
      totalWaitlistBookings: stats?.reduce((sum, s) => sum + (s.waitlist_count || 0), 0) || 0,
      totalCancelledBookings: stats?.reduce((sum, s) => sum + (s.cancelled_count || 0), 0) || 0,
      totalAttendedBookings: stats?.reduce((sum, s) => sum + (s.attended_count || 0), 0) || 0,
      eventsFullyBooked: stats?.filter(s => s.booking_status === 'full').length || 0,
      eventsAlmostFull: stats?.filter(s => s.booking_status === 'almost_full').length || 0,
      eventsAvailable: stats?.filter(s => s.booking_status === 'available').length || 0,
      eventsUnlimited: stats?.filter(s => s.booking_status === 'unlimited').length || 0
    };

    // Calculate upcoming vs past events
    const now = new Date();
    const upcoming = stats?.filter(s => new Date(s.date) >= now) || [];
    const past = stats?.filter(s => new Date(s.date) < now) || [];

    return NextResponse.json({ 
      stats: stats || [],
      overall: overallStats,
      upcoming: {
        count: upcoming.length,
        totalBookings: upcoming.reduce((sum, s) => sum + (s.confirmed_count || 0), 0)
      },
      past: {
        count: past.length,
        totalBookings: past.reduce((sum, s) => sum + (s.confirmed_count || 0), 0),
        totalAttended: past.reduce((sum, s) => sum + (s.attended_count || 0), 0)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/bookings/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


