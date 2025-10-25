import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const { date } = params

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Validate date format
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    console.log('Fetching events for date:', date, 'Formatted date:', dateObj.toISOString().split('T')[0])

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch events for the specified date that have booking enabled
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('date', date)
      .eq('booking_enabled', true)
      .eq('status', 'published')
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: 'Failed to fetch events', details: error.message }, { status: 500 })
    }

    console.log('Fetched events for date:', date, 'Count:', events?.length || 0)
    console.log('Events found:', events?.map(e => ({ id: e.id, title: e.title, date: e.date, booking_enabled: e.booking_enabled, status: e.status })))

    // Check which events have files
    const eventIds = events?.map(event => event.id) || []
    let eventsWithFiles: any[] = []
    
    if (eventIds.length > 0) {
      const { data: resourceEvents } = await supabase
        .from('resource_events')
        .select('event_id')
        .in('event_id', eventIds)
      
      eventsWithFiles = resourceEvents?.map(re => re.event_id) || []
    }

    // Transform the data
    const transformedEvents = events?.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.start_time,
      endTime: event.end_time,
      location: event.location,
      format: event.format,
      organizer: event.organizer,
      author: event.author_name,
      hasFiles: eventsWithFiles.includes(event.id)
    })) || []

    return NextResponse.json({ 
      events: transformedEvents,
      date: date
    })

  } catch (error) {
    console.error('Error in events by date API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
