import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * DEBUG /api/bookings/debug - Simple test to see what's wrong
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found', details: userError }, { status: 404 });
    }

    // Test simple query first
    const { data: simpleBookings, error: simpleError } = await supabaseAdmin
      .from('event_bookings')
      .select('id, event_id, user_id, status')
      .eq('user_id', user.id)
      .limit(5);

    if (simpleError) {
      return NextResponse.json({ 
        error: 'Simple query failed', 
        details: simpleError,
        user: { id: user.id, role: user.role }
      }, { status: 500 });
    }

    // Test with events join
    const { data: bookingsWithEvents, error: joinError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id,
        event_id,
        user_id,
        status,
        booked_at,
        events (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .limit(5);

    if (joinError) {
      return NextResponse.json({ 
        error: 'Join query failed', 
        details: joinError,
        simpleBookings: simpleBookings
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      user: { id: user.id, role: user.role },
      simpleBookings,
      bookingsWithEvents
    });

  } catch (error) {
    console.error('Error in DEBUG /api/bookings/debug:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
