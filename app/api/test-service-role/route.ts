import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing service role access...')
    
    // Test 1: Try to fetch users directly
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .limit(5)
    
    console.log('Users query result:', { users: users?.length || 0, error: usersError?.message })
    
    // Test 2: Try to fetch stations directly
    const { data: stations, error: stationsError } = await supabaseAdmin
      .from('stations')
      .select('slug, title')
      .limit(5)
    
    console.log('Stations query result:', { stations: stations?.length || 0, error: stationsError?.message })
    
    // Test 3: Try to fetch attempts directly
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select('id, user_id, station_slug')
      .limit(5)
    
    console.log('Attempts query result:', { attempts: attempts?.length || 0, error: attemptsError?.message })
    
    return NextResponse.json({
      users: {
        count: users?.length || 0,
        data: users,
        error: usersError?.message
      },
      stations: {
        count: stations?.length || 0,
        data: stations,
        error: stationsError?.message
      },
      attempts: {
        count: attempts?.length || 0,
        data: attempts,
        error: attemptsError?.message
      }
    })
  } catch (error) {
    console.error('Error in test service role API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
