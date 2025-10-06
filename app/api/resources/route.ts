import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build query using admin client
    let query = supabaseAdmin
      .from('resources')
      .select('*')
      .eq('is_active', true)
      .order('upload_date', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,taught_by.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }

    // Fetch linked events for each resource
    const resourcesWithEvents = await Promise.all(
      data.map(async (resource: any) => {
        const { data: linkedEvents, error: eventsError } = await supabaseAdmin
          .from('resource_events')
          .select('event_id')
          .eq('resource_id', resource.id);

        // Fetch event details for each linked event
        let events: any[] = [];
        if (linkedEvents && linkedEvents.length > 0) {
          const eventIds = linkedEvents.map(le => le.event_id);
          
          const { data: eventDetails } = await supabaseAdmin
            .from('events_with_details')
            .select('id, title, date, start_time, location_name')
            .in('id', eventIds);
          
          events = eventDetails || [];
        }
        return { ...resource, linked_events: events };
      })
    );

    return NextResponse.json({ resources: resourcesWithEvents });

  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

