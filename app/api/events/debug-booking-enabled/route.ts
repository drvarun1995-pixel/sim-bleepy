import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all events with booking enabled
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, date, booking_enabled, status')
      .eq('booking_enabled', true)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: 'Failed to fetch events', details: error.message }, { status: 500 })
    }

    // Also get all events to see the difference
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('id, title, date, booking_enabled, status')
      .order('date', { ascending: true })

    return NextResponse.json({
      eventsWithBookingEnabled: events || [],
      allEvents: allEvents || [],
      summary: {
        totalEvents: allEvents?.length || 0,
        eventsWithBookingEnabled: events?.length || 0,
        eventsWithoutBookingEnabled: (allEvents?.length || 0) - (events?.length || 0)
      }
    })

  } catch (error) {
    console.error('Error in debug API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
