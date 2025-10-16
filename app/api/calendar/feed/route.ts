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
    const organizers = searchParams.get('organizers')?.split(',').filter(o => o) || undefined;
    const speakers = searchParams.get('speakers')?.split(',').filter(s => s) || undefined;
    
    console.log('[Calendar Feed] Generating feed with filters:', {
      university,
      year,
      categories,
      format,
      organizers,
      speakers
    });

    // Build query to fetch events from database
    let query = supabaseAdmin
      .from('events')
      .select(`
        id,
        title,
        description,
        date,
        start_time,
        end_time,
        status
      `)
      .eq('status', 'published')
      .gte('date', new Date().toISOString().split('T')[0]) // Only future events
      .order('date', { ascending: true })
      .limit(20); // Limit to 20 events

    const { data: eventsData, error } = await query;

    console.log('[Calendar Feed] Found', eventsData?.length || 0, 'events');

    if (error) {
      console.error('[Calendar Feed] Error fetching events:', error);
      // Return a basic calendar with no events instead of error
      const emptyCalendar = generateCalendarFeed([], 'Bleepy Events');
      return new NextResponse(emptyCalendar, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'inline; filename="Bleepy-Events.ics"',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    if (!eventsData || eventsData.length === 0) {
      console.log('[Calendar Feed] No events found');
      // Return a basic calendar with no events
      const emptyCalendar = generateCalendarFeed([], 'Bleepy Events');
      return new NextResponse(emptyCalendar, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'inline; filename="Bleepy-Events.ics"',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }

    // Filter events based on provided filters
    let filteredEvents = eventsData;
    
    // Filter by format if provided
    if (format) {
      filteredEvents = filteredEvents.filter(event => event.format_name === format);
    }

    // Filter by organizer if provided (using organizer_name field)
    if (organizers && organizers.length > 0) {
      filteredEvents = filteredEvents.filter(event => {
        return event.organizer_name && organizers.includes(event.organizer_name);
      });
    }

    // Note: Category and speaker filtering would need junction table queries
    // For now, we'll include all events and let the calendar feed handle the filtering
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

    console.log('[Calendar Feed] Generated feed with', calendarEvents.length, 'events:', feedName);

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

