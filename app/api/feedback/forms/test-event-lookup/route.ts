import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { eventIds } = await request.json()
    
    console.log('🔍 Testing event lookup for IDs:', eventIds)
    
    // Test the same query that the feedback forms API uses
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, date')
      .in('id', eventIds)

    console.log('📅 Events found:', events)
    console.log('❌ Events error:', eventsError)

    return NextResponse.json({
      success: true,
      requestedIds: eventIds,
      foundEvents: events || [],
      error: eventsError,
      foundCount: events?.length || 0,
      requestedCount: eventIds?.length || 0
    })

  } catch (error) {
    console.error('Error in test event lookup:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
