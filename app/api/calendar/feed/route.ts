import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarFeed, generateFeedName } from '@/lib/calendar-feed';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const university = searchParams.get('university') || undefined;
    const year = searchParams.get('year') || undefined;
    const categories = searchParams.get('categories')?.split(',').filter(c => c) || undefined;
    const format = searchParams.get('format') || undefined;
    const roleType = searchParams.get('roleType') || undefined;
    
    console.log('[Calendar Feed] Generating feed with filters:', {
      university,
      year,
      categories,
      format,
      roleType
    });

    // Build query to fetch events
    let query = supabaseAdmin
      .from('events')
      .select(`
        id,
        title,
        description,
        date,
        start_time,
        end_time,
        is_all_day,
        hide_time,
        hide_end_time,
        location_name,
        organizer_name,
        categories (name),
        format_name,
        event_status,
        status
      `)
      .eq('status', 'published')
      .neq('event_status', 'cancelled')
      .order('date', { ascending: true });

    // Apply filters if provided
    // Note: Categories and formats would need junction table filtering
    // For now, we'll filter in memory after fetching

    const { data: eventsData, error } = await query;

    if (error) {
      console.error('[Calendar Feed] Error fetching events:', error);
      return new NextResponse('Error fetching events', { status: 500 });
    }

    if (!eventsData || eventsData.length === 0) {
      console.log('[Calendar Feed] No events found');
      return new NextResponse('No events found', { status: 404 });
    }

    // Filter events based on categories if provided
    let filteredEvents = eventsData;
    
    if (categories && categories.length > 0) {
      filteredEvents = filteredEvents.filter(event => {
        const eventCategories = event.categories as any[];
        if (!eventCategories || eventCategories.length === 0) return false;
        
        // Check if any of the event's categories match the filter
        return eventCategories.some((cat: any) => 
          categories.includes(cat.name)
        );
      });
    }

    if (format) {
      filteredEvents = filteredEvents.filter(event => event.format_name === format);
    }

    console.log('[Calendar Feed] Filtered events count:', filteredEvents.length);

    // Transform events to calendar event format
    const calendarEvents = filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      date: event.date,
      startTime: event.start_time || '09:00',
      endTime: event.end_time || '17:00',
      location: event.location_name || '',
      isAllDay: event.is_all_day || false,
      hideTime: event.hide_time || false,
      organizer: event.organizer_name || ''
    }));

    // Generate feed name based on filters
    const feedName = generateFeedName({
      university,
      year,
      categories,
      format
    });

    // Generate the .ics calendar feed
    const icsContent = generateCalendarFeed(calendarEvents, feedName);

    console.log('[Calendar Feed] Generated feed:', feedName);

    // Return the .ics file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${feedName.replace(/[^a-zA-Z0-9-_ ]/g, '')}.ics"`,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('[Calendar Feed] Error generating calendar feed:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

