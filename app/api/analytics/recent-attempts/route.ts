import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Create a direct admin client that bypasses RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdminDirect = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch recent attempts first
    const { data: attempts, error: attemptsError } = await supabaseAdminDirect
      .from('attempts')
      .select(`
        id,
        start_time,
        end_time,
        duration,
        overall_band,
        scores,
        user_id,
        station_slug
      `)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (attemptsError) {
      console.error('Error fetching recent attempts:', attemptsError)
      return NextResponse.json({ error: 'Failed to fetch recent attempts' }, { status: 500 })
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get unique user IDs and station slugs
    const userIds = [...new Set(attempts.map(a => a.user_id))]
    const stationSlugs = [...new Set(attempts.map(a => a.station_slug))]

    // Fetch users data separately - try with RLS bypass
    const { data: users, error: usersError } = await supabaseAdminDirect
      .from('users')
      .select('id, email, name')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      // Try alternative approach - fetch all users and filter
      const { data: allUsers, error: allUsersError } = await supabaseAdminDirect
        .from('users')
        .select('id, email, name')
      
      if (allUsersError) {
        console.error('Error fetching all users:', allUsersError)
      } else {
        console.log('Fetched all users:', allUsers?.length || 0, 'users')
        // Filter to only the users we need
        const filteredUsers = allUsers?.filter(u => userIds.includes(u.id)) || []
        console.log('Filtered users:', filteredUsers.length, 'users')
        // Use the filtered users
        const usersMap = new Map(filteredUsers.map(u => [u.id, u]))
        const stationsMap = new Map(stations?.map(s => [s.slug, s]) || [])
        
        const result = attempts.map(attempt => {
          const user = usersMap.get(attempt.user_id)
          const station = stationsMap.get(attempt.station_slug)
          
          return {
            id: attempt.id,
            startTime: attempt.start_time,
            endTime: attempt.end_time,
            duration: attempt.duration,
            overallBand: attempt.overall_band,
            scores: attempt.scores,
            user: {
              id: attempt.user_id,
              email: user?.email || '',
              name: user?.name || ''
            },
            station: {
              slug: attempt.station_slug,
              title: station?.title || ''
            }
          }
        })
        
        return NextResponse.json({ data: result })
      }
    } else {
      console.log('Fetched users:', users?.length || 0, 'users')
    }

    // Fetch stations data separately
    const { data: stations, error: stationsError } = await supabaseAdminDirect
      .from('stations')
      .select('slug, title')
      .in('slug', stationSlugs)

    if (stationsError) {
      console.error('Error fetching stations:', stationsError)
    } else {
      console.log('Fetched stations:', stations?.length || 0, 'stations')
    }

    // Create lookup maps
    const usersMap = new Map(users?.map(u => [u.id, u]) || [])
    const stationsMap = new Map(stations?.map(s => [s.slug, s]) || [])

    // Format the response
    const result = attempts.map(attempt => {
      const user = usersMap.get(attempt.user_id)
      const station = stationsMap.get(attempt.station_slug)
      
      return {
        id: attempt.id,
        startTime: attempt.start_time,
        endTime: attempt.end_time,
        duration: attempt.duration,
        overallBand: attempt.overall_band,
        scores: attempt.scores,
        user: {
          id: attempt.user_id,
          email: user?.email || '',
          name: user?.name || ''
        },
        station: {
          slug: attempt.station_slug,
          title: station?.title || ''
        }
      }
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error in recent attempts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
