import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarFeed, generateFeedName } from '@/lib/calendar-feed';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters - properly decode URL-encoded values
    const university = searchParams.get('university') ? decodeURIComponent(searchParams.get('university')!) : undefined;
    const year = searchParams.get('year') ? decodeURIComponent(searchParams.get('year')!) : undefined;
    const categoriesParam = searchParams.get('categories');
    const categories = categoriesParam 
      ? decodeURIComponent(categoriesParam).split(',').map(c => c.trim()).filter(c => c)
      : undefined;
    const format = searchParams.get('format') ? decodeURIComponent(searchParams.get('format')!) : undefined;
    const organizersParam = searchParams.get('organizers');
    const organizers = organizersParam 
      ? decodeURIComponent(organizersParam).split(',').map(o => o.trim()).filter(o => o)
      : undefined;
    const speakersParam = searchParams.get('speakers');
    const speakers = speakersParam 
      ? decodeURIComponent(speakersParam).split(',').map(s => s.trim()).filter(s => s)
      : undefined;
    
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
      console.log('[Calendar Feed] Filtering by categories:', categories);
      console.log('[Calendar Feed] Total events before category filter:', filteredEvents.length);
      
      // Get all event-category relationships for the events we're considering
      const eventIds = eventsData.map(e => e.id);
      console.log('[Calendar Feed] Checking categories for', eventIds.length, 'events');
      
      // First, get category IDs for the category names we're filtering by
      const normalizedFilterCategories = categories.map(c => c.toLowerCase().trim());
      console.log('[Calendar Feed] Looking for normalized categories:', normalizedFilterCategories);
      
      const { data: matchingCategories, error: categoryLookupError } = await supabaseAdmin
        .from('categories')
        .select('id, name')
        .in('name', categories); // Try exact match first
      
      if (categoryLookupError) {
        console.error('[Calendar Feed] Error fetching categories:', categoryLookupError);
      }
      
      // If exact match doesn't work, try case-insensitive
      let categoryIds: string[] = [];
      if (matchingCategories && matchingCategories.length > 0) {
        categoryIds = matchingCategories.map(c => c.id);
        console.log('[Calendar Feed] Found category IDs:', categoryIds, 'for categories:', matchingCategories.map(c => c.name));
      } else {
        // Try case-insensitive lookup
        const { data: allCategories } = await supabaseAdmin
          .from('categories')
          .select('id, name');
        
        if (allCategories) {
          categoryIds = allCategories
            .filter(cat => normalizedFilterCategories.includes(cat.name.toLowerCase().trim()))
            .map(cat => cat.id);
          console.log('[Calendar Feed] Found category IDs (case-insensitive):', categoryIds);
        }
      }
      
      if (categoryIds.length === 0) {
        console.log('[Calendar Feed] No matching categories found in database, returning empty calendar');
        filteredEvents = [];
      } else {
        // Now get events that have these category IDs
        const { data: eventCategories, error: categoryError } = await supabaseAdmin
          .from('event_categories')
          .select('event_id')
          .in('category_id', categoryIds)
          .in('event_id', eventIds);

        if (categoryError) {
          console.error('[Calendar Feed] Error fetching event categories:', categoryError);
          // If there's an error, return empty calendar to be safe
          filteredEvents = [];
        } else if (!eventCategories || eventCategories.length === 0) {
          // If no event categories found, return empty calendar
          console.log('[Calendar Feed] No events have the selected categories, returning empty calendar');
          filteredEvents = [];
        } else {
          const eventIdsWithMatchingCategories = new Set(eventCategories.map(ec => ec.event_id));
          
          console.log('[Calendar Feed] Found', eventIdsWithMatchingCategories.size, 'unique events matching categories');
          console.log('[Calendar Feed] Matching event IDs (first 10):', Array.from(eventIdsWithMatchingCategories).slice(0, 10));
          
          const beforeFilterCount = filteredEvents.length;
          filteredEvents = filteredEvents.filter(e => eventIdsWithMatchingCategories.has(e.id));
          const afterFilterCount = filteredEvents.length;
          
          console.log('[Calendar Feed] Filtered from', beforeFilterCount, 'to', afterFilterCount, 'events');
          
          // If no events match the categories, return empty calendar
          if (filteredEvents.length === 0) {
            console.log('[Calendar Feed] No events match the selected categories - returning empty calendar');
          }
        }
      }
    }

    // Filter by format
    if (format && filteredEvents.length > 0) {
      const normalizedFormat = format.trim().toLowerCase();
      filteredEvents = filteredEvents.filter(e => {
        const formatName = (e.format as any)?.name;
        return formatName && formatName.toLowerCase().trim() === normalizedFormat;
      });
    }

    // Filter by organizers
    if (organizers && organizers.length > 0 && filteredEvents.length > 0) {
      const normalizedOrganizers = organizers.map(o => o.toLowerCase().trim());
      filteredEvents = filteredEvents.filter(e => {
        const organizerName = (e.organizer as any)?.name;
        return organizerName && normalizedOrganizers.includes(organizerName.toLowerCase().trim());
      });
    }

    // Filter by speakers (need to check junction table)
    if (speakers && speakers.length > 0 && filteredEvents.length > 0) {
      const normalizedSpeakers = speakers.map(s => s.toLowerCase().trim());
      const { data: eventSpeakers, error: speakerError } = await supabaseAdmin
        .from('event_speakers')
        .select('event_id, speaker:speakers(name)')
        .in('event_id', filteredEvents.map(e => e.id));

      if (speakerError) {
        console.error('[Calendar Feed] Error fetching event speakers:', speakerError);
      }

      if (eventSpeakers && eventSpeakers.length > 0) {
        const eventIdsWithMatchingSpeakers = new Set(
          eventSpeakers
            .filter(es => {
              const speakerName = (es.speaker as any)?.name;
              return speakerName && normalizedSpeakers.includes(speakerName.toLowerCase().trim());
            })
            .map(es => es.event_id)
        );
        filteredEvents = filteredEvents.filter(e => eventIdsWithMatchingSpeakers.has(e.id));
      } else {
        // If no event speakers found, return empty calendar when speakers are specified
        filteredEvents = [];
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
    // Use shorter cache time and no-cache when filters are applied to ensure fresh data
    const cacheControl = (categories || format || organizers || speakers)
      ? 'public, max-age=300, s-maxage=300, must-revalidate, no-cache'
      : 'public, max-age=1800, s-maxage=1800, must-revalidate';
    
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${feedName.replace(/[^a-zA-Z0-9-_ ]/g, '')}.ics"`,
        'Cache-Control': cacheControl,
        // Add ETag based on filters and timestamp to force refresh when filters change
        'ETag': `"${Date.now()}-${categories?.join(',') || 'all'}-${format || 'all'}"`,
        // Prevent Google Calendar from caching filtered feeds too aggressively
        'Pragma': 'no-cache',
      },
    });

  } catch (error) {
    console.error('[Calendar Feed] Error generating calendar feed:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

