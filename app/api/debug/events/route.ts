import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a few events to debug
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('id, title, author_id, author_name')
      .limit(5);

    if (error) {
      console.error('Error fetching events for debug:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Also check the events_with_details view
    const { data: eventsWithDetails, error: detailsError } = await supabaseAdmin
      .from('events_with_details')
      .select('id, title, author_id, author_name')
      .limit(5);

    if (detailsError) {
      console.error('Error fetching events_with_details for debug:', detailsError);
    }

    return NextResponse.json({
      message: 'Debug data fetched successfully',
      events: events || [],
      eventsWithDetails: eventsWithDetails || [],
      userEmail: session.user.email
    });
  } catch (error) {
    console.error('Error in debug events API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



