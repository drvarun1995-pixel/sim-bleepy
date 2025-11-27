import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarFeed, generateFeedName } from '@/lib/calendar-feed';
import { supabaseAdmin } from '@/utils/supabase';
import { logInfo, logError, logWarning } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Log the raw URL and search params for debugging
    const rawUrl = request.url;
    const searchParamsObj = Object.fromEntries(searchParams.entries());
    
    // Log immediately - don't await to avoid blocking
    logInfo(
      '[Calendar Feed] Request received',
      { url: rawUrl, searchParams: searchParamsObj },
      '/api/calendar/feed'
    ).catch(err => console.error('Failed to log:', err));
    
    // Also log to console for immediate visibility
    console.log('[Calendar Feed] Request received:', { url: rawUrl, searchParams: searchParamsObj });
    
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
    
    // Log immediately - don't await to avoid blocking
    logInfo(
      '[Calendar Feed] Parsed filters',
      { university, year, categories, format, organizers, speakers },
      '/api/calendar/feed'
    ).catch(err => console.error('Failed to log:', err));
    
    console.log('[Calendar Feed] Parsed filters:', { university, year, categories, format, organizers, speakers });
    
    // CRITICAL: If categories are specified but empty after processing, log it
    if (categoriesParam && (!categories || categories.length === 0)) {
      logError(
        '[Calendar Feed] Categories parameter provided but resulted in empty array',
        undefined,
        { categoriesParam, decoded: categories },
        '/api/calendar/feed'
      ).catch(err => console.error('Failed to log:', err));
    }

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
    
    // CRITICAL DEBUG: Log if we should be filtering
    if (categories && categories.length > 0) {
      console.log('[Calendar Feed] *** CATEGORIES PROVIDED - FILTERING SHOULD HAPPEN ***');
      console.log('[Calendar Feed] Categories to filter:', JSON.stringify(categories));
    } else {
      console.log('[Calendar Feed] *** NO CATEGORIES PROVIDED - RETURNING ALL EVENTS ***');
    }

    // Filter by categories (check both junction table AND events.category_id)
    if (categories && categories.length > 0) {
      logInfo(
        '[Calendar Feed] Starting category filter',
        { categories, totalEventsBeforeFilter: filteredEvents.length },
        '/api/calendar/feed'
      ).catch(err => console.error('Failed to log:', err));
      
      console.log('[Calendar Feed] ========== STARTING CATEGORY FILTER ==========');
      console.log('[Calendar Feed] Categories to filter:', JSON.stringify(categories));
      console.log('[Calendar Feed] Total events before filter:', filteredEvents.length);
      
      // CRITICAL: If we have categories to filter, we MUST filter - don't return all events
      if (filteredEvents.length === 0) {
        console.log('[Calendar Feed] No events to filter, returning empty calendar');
        // Return early with empty calendar
        const emptyCalendar = generateCalendarFeed([], generateFeedName({ categories }));
        return new NextResponse(emptyCalendar, {
          status: 200,
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'inline; filename="Bleepy-Events.ics"',
            'Cache-Control': 'public, max-age=300, s-maxage=300, must-revalidate, no-cache',
          },
        });
      }
      
      // Get all event-category relationships for the events we're considering
      const eventIds = eventsData.map(e => e.id);
      console.log('[Calendar Feed] Checking categories for', eventIds.length, 'events');
      
      // First, get category IDs for the category names we're filtering by
      const normalizedFilterCategories = categories.map(c => c.toLowerCase().trim());
      console.log('[Calendar Feed] Looking for normalized categories:', normalizedFilterCategories);
      
      // Get all categories and match case-insensitively
      const { data: allCategories, error: allCategoriesError } = await supabaseAdmin
        .from('categories')
        .select('id, name');
      
      if (allCategoriesError) {
        console.error('[Calendar Feed] Error fetching all categories:', allCategoriesError);
        filteredEvents = [];
      } else if (!allCategories || allCategories.length === 0) {
        console.log('[Calendar Feed] No categories found in database, returning empty calendar');
        filteredEvents = [];
      } else {
        // Find matching category IDs (case-insensitive)
        const categoryIds = allCategories
          .filter(cat => normalizedFilterCategories.includes(cat.name.toLowerCase().trim()))
          .map(cat => cat.id);
        
        console.log('[Calendar Feed] Found category IDs:', categoryIds, 'for categories:', 
          allCategories.filter(cat => normalizedFilterCategories.includes(cat.name.toLowerCase().trim())).map(c => c.name));
        
        if (categoryIds.length === 0) {
          logWarning(
            '[Calendar Feed] No matching categories found in database',
            { requestedCategories: categories, allCategoriesInDb: allCategories.map(c => c.name) },
            '/api/calendar/feed'
          ).catch(err => console.error('Failed to log:', err));
          console.log('[Calendar Feed] No matching categories found, returning empty calendar');
          filteredEvents = [];
        } else {
          const matchingCategoryNames = allCategories.filter(cat => categoryIds.includes(cat.id)).map(c => c.name);
          logInfo(
            '[Calendar Feed] Found matching category IDs',
            { categoryIds, categoryNames: matchingCategoryNames },
            '/api/calendar/feed'
          ).catch(err => console.error('Failed to log:', err));
          console.log('[Calendar Feed] Found category IDs:', categoryIds, 'for:', matchingCategoryNames);
          
          // Get events from junction table (event_categories)
          const { data: eventCategoriesFromJunction, error: junctionError } = await supabaseAdmin
            .from('event_categories')
            .select('event_id')
            .in('category_id', categoryIds)
            .in('event_id', eventIds);
          
          if (junctionError) {
            logError(
              '[Calendar Feed] Error fetching event categories from junction table',
              junctionError as Error,
              { categoryIds, eventIdsCount: eventIds.length },
              '/api/calendar/feed'
            ).catch(err => console.error('Failed to log:', err));
            console.error('[Calendar Feed] Junction table error:', junctionError);
          }
          
          // Also get events that have category_id directly in events table
          const { data: eventsWithCategoryId, error: eventsError } = await supabaseAdmin
            .from('events')
            .select('id')
            .in('id', eventIds)
            .in('category_id', categoryIds);
          
          if (eventsError) {
            logError(
              '[Calendar Feed] Error fetching events with category_id',
              eventsError as Error,
              { categoryIds, eventIdsCount: eventIds.length },
              '/api/calendar/feed'
            ).catch(err => console.error('Failed to log:', err));
            console.error('[Calendar Feed] Events table error:', eventsError);
          }
          
          // Combine both sources
          const eventIdsWithMatchingCategories = new Set<string>();
          
          if (eventCategoriesFromJunction) {
            eventCategoriesFromJunction.forEach(ec => eventIdsWithMatchingCategories.add(ec.event_id));
            logInfo(
              '[Calendar Feed] Events from junction table',
              { count: eventCategoriesFromJunction.length, sampleIds: eventCategoriesFromJunction.slice(0, 5).map(e => e.event_id) },
              '/api/calendar/feed'
            ).catch(err => console.error('Failed to log:', err));
            console.log('[Calendar Feed] Found', eventCategoriesFromJunction.length, 'events from junction table');
          }
          
          if (eventsWithCategoryId) {
            eventsWithCategoryId.forEach(e => eventIdsWithMatchingCategories.add(e.id));
            logInfo(
              '[Calendar Feed] Events from category_id column',
              { count: eventsWithCategoryId.length, sampleIds: eventsWithCategoryId.slice(0, 5).map(e => e.id) },
              '/api/calendar/feed'
            ).catch(err => console.error('Failed to log:', err));
            console.log('[Calendar Feed] Found', eventsWithCategoryId.length, 'events from category_id column');
          }
          
          const totalMatchingEvents = eventIdsWithMatchingCategories.size;
          logInfo(
            '[Calendar Feed] Total unique events matching categories',
            { totalMatching: totalMatchingEvents, sampleEventIds: Array.from(eventIdsWithMatchingCategories).slice(0, 10) },
            '/api/calendar/feed'
          ).catch(err => console.error('Failed to log:', err));
          console.log('[Calendar Feed] Total unique events matching:', totalMatchingEvents);
          console.log('[Calendar Feed] Sample matching event IDs:', Array.from(eventIdsWithMatchingCategories).slice(0, 10));
          
          if (totalMatchingEvents === 0) {
            logWarning(
              '[Calendar Feed] No events have the selected categories - returning empty calendar',
              { categories, categoryIds },
              '/api/calendar/feed'
            ).catch(err => console.error('Failed to log:', err));
            console.log('[Calendar Feed] No matching events, returning empty calendar');
            filteredEvents = [];
          } else {
            const beforeFilterCount = filteredEvents.length;
            filteredEvents = filteredEvents.filter(e => eventIdsWithMatchingCategories.has(e.id));
            const afterFilterCount = filteredEvents.length;
            
            logInfo(
              '[Calendar Feed] Category filter applied',
              { 
                beforeCount: beforeFilterCount, 
                afterCount: afterFilterCount,
                filteredOut: beforeFilterCount - afterFilterCount,
                sampleFilteredTitles: filteredEvents.slice(0, 5).map(e => e.title)
              },
              '/api/calendar/feed'
            ).catch(err => console.error('Failed to log:', err));
            console.log('[Calendar Feed] Filtered from', beforeFilterCount, 'to', afterFilterCount, 'events');
            console.log('[Calendar Feed] Sample filtered titles:', filteredEvents.slice(0, 5).map(e => e.title));
            
            if (filteredEvents.length === 0) {
              logWarning(
                '[Calendar Feed] Filter resulted in zero events - returning empty calendar',
                { categories, categoryIds, totalMatchingEvents },
                '/api/calendar/feed'
              ).catch(err => console.error('Failed to log:', err));
              console.log('[Calendar Feed] Filter resulted in zero events');
            }
          }
        }
      }
    } else {
      logInfo(
        '[Calendar Feed] No category filter applied - returning all events',
        { totalEvents: filteredEvents.length },
        '/api/calendar/feed'
      ).catch(err => console.error('Failed to log:', err));
      console.log('[Calendar Feed] No categories provided - returning all', filteredEvents.length, 'events');
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

    logInfo(
      '[Calendar Feed] Final result',
      { 
        totalEvents: filteredEvents.length,
        sampleTitles: filteredEvents.slice(0, 5).map(e => e.title),
        categories: categories || 'none'
      },
      '/api/calendar/feed'
    ).catch(err => console.error('Failed to log:', err));
    console.log('[Calendar Feed] ========== FINAL RESULT ==========');
    console.log('[Calendar Feed] Returning', filteredEvents.length, 'events');
    console.log('[Calendar Feed] Categories filter:', categories || 'none');
    console.log('[Calendar Feed] Sample event titles:', filteredEvents.slice(0, 5).map(e => e.title));

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

