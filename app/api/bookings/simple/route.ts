import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * SIMPLE /api/bookings/simple - Minimal version to test
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Simple query
    const { data: bookings, error } = await supabaseAdmin
      .from('event_bookings')
      .select('id, event_id, user_id, status, booked_at')
      .eq('user_id', user.id)
      .order('booked_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: error,
        message: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      bookings: bookings || [],
      count: bookings?.length || 0
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Catch error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

