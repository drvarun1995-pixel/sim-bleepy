import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch recent attempts with user and station information
    const { data: attempts, error } = await supabaseAdmin
      .from('attempts')
      .select(`
        id,
        start_time,
        end_time,
        duration,
        overall_band,
        scores,
        user_id,
        station_slug,
        stations!inner(title),
        users!inner(email, name)
      `)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent attempts:', error)
      return NextResponse.json({ error: 'Failed to fetch recent attempts' }, { status: 500 })
    }

    // Format the response
    const result = attempts?.map(attempt => ({
      id: attempt.id,
      startTime: attempt.start_time,
      endTime: attempt.end_time,
      duration: attempt.duration,
      overallBand: attempt.overall_band,
      scores: attempt.scores,
      user: {
        id: attempt.user_id,
        email: Array.isArray(attempt.users) ? attempt.users[0]?.email : attempt.users?.email || '',
        name: Array.isArray(attempt.users) ? attempt.users[0]?.name : attempt.users?.name || ''
      },
      station: {
        slug: attempt.station_slug,
        title: Array.isArray(attempt.stations) ? attempt.stations[0]?.title : attempt.stations?.title || ''
      }
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error in recent attempts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
