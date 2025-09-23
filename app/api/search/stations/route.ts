import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    // Fetch all stations from database
    const { data: stations, error } = await supabaseAdmin
      .from('stations')
      .select('slug, title')
      .order('title', { ascending: true })

    if (error) {
      console.error('Error fetching stations:', error)
      return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 })
    }

    if (!stations || stations.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // If no search query, return all stations
    if (!query.trim()) {
      return NextResponse.json({ 
        data: stations.slice(0, limit).map(station => ({
          title: station.title,
          description: `Practice ${station.title.toLowerCase()} scenarios`,
          href: `/station/${station.slug}`,
          type: 'station',
          slug: station.slug
        }))
      })
    }

    // Filter stations based on search query
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    const filteredStations = stations.filter(station => {
      const title = station.title.toLowerCase()
      const slug = station.slug.toLowerCase()
      
      // Check if all search terms are found in title or slug
      return searchTerms.every(term => 
        title.includes(term) || slug.includes(term)
      )
    })

    // Map to search result format
    const results = filteredStations.slice(0, limit).map(station => ({
      title: station.title,
      description: `Practice ${station.title.toLowerCase()} scenarios`,
      href: `/station/${station.slug}`,
      type: 'station',
      slug: station.slug
    }))

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error in search stations API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
