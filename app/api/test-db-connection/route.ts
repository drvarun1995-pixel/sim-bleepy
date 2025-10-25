import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection')
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set')
    console.log('Supabase Key:', supabaseKey ? 'Set' : 'Not set')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('events')
      .select('id, title, booking_enabled, status')
      .limit(5)
    
    console.log('Test query result:', testData)
    console.log('Test query error:', testError)
    
    // Test specific event lookup
    const { data: specificEvent, error: specificError } = await supabase
      .from('events')
      .select('*')
      .eq('id', '0b7b336b-00f9-4fd8-849c-34e0585cdffc')
    
    console.log('Specific event lookup:', specificEvent)
    console.log('Specific event error:', specificError)
    
    // Test the same query as events/date API
    const { data: dateEvents, error: dateError } = await supabase
      .from('events')
      .select('*')
      .eq('date', '2025-10-26')
      .eq('booking_enabled', true)
      .eq('status', 'published')
      .order('start_time', { ascending: true })
    
    console.log('Date events query result:', dateEvents)
    console.log('Date events query error:', dateError)
    
    return NextResponse.json({
      success: true,
      testData: testData || [],
      testError: testError,
      specificEvent: specificEvent || [],
      specificError: specificError,
      dateEvents: dateEvents || [],
      dateError: dateError,
      connectionInfo: {
        urlSet: !!supabaseUrl,
        keySet: !!supabaseKey
      }
    })
    
  } catch (error) {
    console.error('Database connection test error:', error)
    return NextResponse.json(
      { error: 'Database connection test failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
