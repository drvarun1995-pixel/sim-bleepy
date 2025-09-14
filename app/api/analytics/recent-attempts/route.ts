import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch recent attempts first
    const { data: attempts, error: attemptsError } = await supabaseAdmin
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

    // Fetch users data separately
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    } else {
      console.log('Fetched users:', users?.length || 0, 'users')
    }

    // Fetch stations data separately
    const { data: stations, error: stationsError } = await supabaseAdmin
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
