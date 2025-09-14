import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdminDirect = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch recent attempts
    const { data: attempts, error: attemptsError } = await supabaseAdminDirect
      .from('attempts')
      .select(`
        id,
        user_id,
        station_slug,
        start_time,
        end_time,
        duration,
        overall_band,
        scores,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError)
      return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 })
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get unique user IDs and station slugs
    const userIds = Array.from(new Set(attempts.map(a => a.user_id)))
    const stationSlugs = Array.from(new Set(attempts.map(a => a.station_slug)))

    // Fetch users and stations data in parallel
    const [usersResult, stationsResult] = await Promise.all([
      supabaseAdminDirect
        .from('users')
        .select('id, email, name')
        .in('id', userIds),
      supabaseAdminDirect
        .from('stations')
        .select('slug, title')
        .in('slug', stationSlugs)
    ])

    if (usersResult.error) {
      console.error('Error fetching users:', usersResult.error)
    } else {
      console.log('Fetched users:', usersResult.data?.length || 0, 'users')
    }

    if (stationsResult.error) {
      console.error('Error fetching stations:', stationsResult.error)
    } else {
      console.log('Fetched stations:', stationsResult.data?.length || 0, 'stations')
    }

    // Create lookup maps
    const usersMap = new Map(usersResult.data?.map(u => [u.id, u]) || [])
    const stationsMap = new Map(stationsResult.data?.map(s => [s.slug, s]) || [])

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
    console.error('Error in recent-attempts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}