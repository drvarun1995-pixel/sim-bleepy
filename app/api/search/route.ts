import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query.trim()) {
      // Return default suggestions when no query
      return NextResponse.json({ 
        data: [
          {
            title: 'Clinical Stations',
            description: 'Practice OSCE skills with AI patients',
            href: '/dashboard/stations',
            type: 'navigation',
            icon: 'Stethoscope'
          },
          {
            title: 'Dashboard',
            description: 'View your clinical training progress',
            href: '/dashboard',
            type: 'navigation',
            icon: 'BarChart3'
          },
          {
            title: 'History',
            description: 'View your past consultation attempts',
            href: '/history',
            type: 'navigation',
            icon: 'History'
          },
          {
            title: 'Help & Support',
            description: 'Get help with using the platform',
            href: '/help',
            type: 'navigation',
            icon: 'HelpCircle'
          }
        ]
      })
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    const results = []

    // Search stations from database
    try {
      const { data: stations, error } = await supabaseAdmin
        .from('stations')
        .select('slug, title')
        .order('title', { ascending: true })

      if (!error && stations) {
        const filteredStations = stations.filter(station => {
          const title = station.title.toLowerCase()
          const slug = station.slug.toLowerCase()
          
          return searchTerms.every(term => 
            title.includes(term) || slug.includes(term)
          )
        })

        results.push(...filteredStations.map(station => ({
          title: station.title,
          description: `Practice ${station.title.toLowerCase()} scenarios`,
          href: `/station/${station.slug}`,
          type: 'station',
          icon: 'Stethoscope',
          slug: station.slug
        })))
      }
    } catch (error) {
      console.error('Error fetching stations:', error)
    }

    // Add navigation items based on search
    const navigationItems = [
      {
        title: 'Clinical Stations',
        description: 'Practice OSCE skills with AI patients',
        href: '/dashboard/stations',
        type: 'navigation',
        icon: 'Stethoscope',
        keywords: ['stations', 'clinical', 'practice', 'osce', 'ai', 'patients']
      },
      {
        title: 'Dashboard',
        description: 'View your clinical training progress',
        href: '/dashboard',
        type: 'navigation',
        icon: 'BarChart3',
        keywords: ['dashboard', 'progress', 'training', 'clinical']
      },
      {
        title: 'History',
        description: 'View your past consultation attempts',
        href: '/history',
        type: 'navigation',
        icon: 'History',
        keywords: ['history', 'past', 'attempts', 'consultations']
      },
      {
        title: 'Help & Support',
        description: 'Get help with using the platform',
        href: '/help',
        type: 'navigation',
        icon: 'HelpCircle',
        keywords: ['help', 'support', 'assistance', 'guide']
      },
      {
        title: 'Features',
        description: 'Learn about platform capabilities',
        href: '/features',
        type: 'navigation',
        icon: 'Target',
        keywords: ['features', 'capabilities', 'platform', 'learn']
      }
    ]

    // Filter navigation items
    const filteredNavigation = navigationItems.filter(item => {
      const title = item.title.toLowerCase()
      const description = item.description.toLowerCase()
      const keywords = item.keywords.join(' ').toLowerCase()
      
      return searchTerms.every(term => 
        title.includes(term) || description.includes(term) || keywords.includes(term)
      )
    })

    results.push(...filteredNavigation)

    // Limit results
    const limitedResults = results.slice(0, limit)

    return NextResponse.json({ data: limitedResults })
  } catch (error) {
    console.error('Error in search API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
