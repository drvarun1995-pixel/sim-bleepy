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

    // Build query to fetch ALL future events (no limit)
    let query = supabaseAdmin
      .from('events')
      .select(`
        id,
        title,
        description,
        date,
        start_time,
        end_time,
        status,
        location:locations(name),
        organizer:organizers(name),
        format:formats(name),
        is_all_day,
        hide_time
      `)
      .eq('status', 'published')
      .gte('date', new Date().toISOString().split('T')[0]) // Only future events
      .order('date', { ascending: true });

    const { data: eventsData, error } = await query;

    console.log('[Calendar Feed] Found', eventsData?.length || 0, 'events before filtering');

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

    // Now filter events based on categories, organizers, speakers
    let filteredEvents = eventsData;

    // Filter by categories (need to check junction table)
    if (categories && categories.length > 0) {
      const { data: eventCategories } = await supabaseAdmin
        .from('event_categories')
        .select('event_id, category:categories(name)')
        .in('event_id', eventsData.map(e => e.id));

      if (eventCategories) {
        const eventIdsWithMatchingCategories = new Set(
          eventCategories
            .filter(ec => categories.includes((ec.category as any)?.name))
            .map(ec => ec.event_id)
        );
        filteredEvents = filteredEvents.filter(e => eventIdsWithMatchingCategories.has(e.id));
      }
    }

    // Filter by format
    if (format && filteredEvents.length > 0) {
      filteredEvents = filteredEvents.filter(e => (e.format as any)?.name === format);
    }

    // Filter by organizers
    if (organizers && organizers.length > 0 && filteredEvents.length > 0) {
      filteredEvents = filteredEvents.filter(e => {
        const organizerName = (e.organizer as any)?.name;
        return organizerName && organizers.includes(organizerName);
      });
    }

    // Filter by speakers (need to check junction table)
    if (speakers && speakers.length > 0 && filteredEvents.length > 0) {
      const { data: eventSpeakers } = await supabaseAdmin
        .from('event_speakers')
        .select('event_id, speaker:speakers(name)')
        .in('event_id', filteredEvents.map(e => e.id));

      if (eventSpeakers) {
        const eventIdsWithMatchingSpeakers = new Set(
          eventSpeakers
            .filter(es => speakers.includes((es.speaker as any)?.name))
            .map(es => es.event_id)
        );
        filteredEvents = filteredEvents.filter(e => eventIdsWithMatchingSpeakers.has(e.id));
      }
    }

    console.log('[Calendar Feed] Filtered to', filteredEvents.length, 'events');

    // Transform events to calendar event format
    const calendarEvents = filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      date: event.date,
      startTime: event.start_time || '09:00',
      endTime: event.end_time || '17:00',
      location: (event.location as any)?.name || '',
      isAllDay: event.is_all_day || false,
      hideTime: event.hide_time || false,
      organizer: (event.organizer as any)?.name || ''
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

    // Return the .ics file with optimized headers for Google Calendar
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${feedName.replace(/[^a-zA-Z0-9-_ ]/g, '')}.ics"`,
        // Shorter cache time to help Google Calendar sync more frequently
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, must-revalidate',
        // Add ETag for better caching
        'ETag': `"${Date.now()}"`,
      },
    });

  } catch (error) {
    console.error('[Calendar Feed] Error generating calendar feed:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

