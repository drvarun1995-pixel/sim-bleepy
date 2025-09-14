import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const stationSlug = searchParams.get('station')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Build the query
    let query = supabaseAdmin
      .from('attempts')
      .select(`
        start_time,
        station_slug,
        stations!inner(title)
      `)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())

    // Filter by station if specified
    if (stationSlug) {
      query = query.eq('station_slug', stationSlug)
    }

    const { data: attempts, error } = await query

    if (error) {
      console.error('Error fetching daily usage:', error)
      return NextResponse.json({ error: 'Failed to fetch daily usage' }, { status: 500 })
    }

    // Group by date and station
    const dailyUsage: Record<string, Record<string, number>> = {}

    attempts?.forEach(attempt => {
      const date = new Date(attempt.start_time).toISOString().split('T')[0]
      const station = attempt.station_slug

      if (!dailyUsage[date]) {
        dailyUsage[date] = {}
      }
      if (!dailyUsage[date][station]) {
        dailyUsage[date][station] = 0
      }
      dailyUsage[date][station]++
    })

    // Convert to array format for easier consumption
    const result = Object.entries(dailyUsage).map(([date, stations]) => ({
      date,
      stations: Object.entries(stations).map(([slug, count]) => ({
        slug,
        count
      }))
    })).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error in daily usage API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
