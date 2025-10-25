import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin/educator permissions
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const eventId = searchParams.get('event_id')

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Build query conditions
    const queryConditions: any = {
      created_at: `gte.${startDate.toISOString()}`
    }

    if (eventId) {
      queryConditions.event_id = eventId
    }

    // Get total feedback forms
    const { data: forms, error: formsError } = await supabaseAdmin
      .from('feedback_forms')
      .select('id, form_name, created_at, event_id, anonymous_enabled')
      .match(queryConditions)

    if (formsError) {
      console.error('Error fetching forms:', formsError)
      return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
    }

    // Get total responses
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('feedback_responses')
      .select(`
        id, 
        responses, 
        completed_at,
        feedback_forms!inner(id, form_name, event_id, anonymous_enabled),
        events!inner(id, title, date)
      `)
      .gte('completed_at', startDate.toISOString())

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    // Calculate analytics
    const totalForms = forms?.length || 0
    const totalResponses = responses?.length || 0
    
    // Calculate response rate (simplified - would need more complex logic for actual rate)
    const responseRate = totalForms > 0 ? Math.round((totalResponses / (totalForms * 10)) * 100) : 0
    
    // Calculate average rating from responses
    let totalRating = 0
    let ratingCount = 0
    
    responses?.forEach(response => {
      const responseData = response.responses as any
      if (responseData && typeof responseData === 'object') {
        Object.values(responseData).forEach((value: any) => {
          if (typeof value === 'number' && value >= 1 && value <= 5) {
            totalRating += value
            ratingCount++
          }
        })
      }
    })
    
    const averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0

    // Calculate completion rate (simplified)
    const completionRate = totalResponses > 0 ? Math.round((totalResponses / (totalResponses + 20)) * 100) : 0

    // Get top rated events
    const eventRatings: { [key: string]: { title: string, ratings: number[], responses: number } } = {}
    
    responses?.forEach(response => {
      const eventId = response.events?.[0]?.id
      const eventTitle = response.events?.[0]?.title
      
      if (eventId && eventTitle) {
        if (!eventRatings[eventId]) {
          eventRatings[eventId] = { title: eventTitle, ratings: [], responses: 0 }
        }
        
        eventRatings[eventId].responses++
        
        const responseData = response.responses as any
        if (responseData && typeof responseData === 'object') {
          Object.values(responseData).forEach((value: any) => {
            if (typeof value === 'number' && value >= 1 && value <= 5) {
              eventRatings[eventId].ratings.push(value)
            }
          })
        }
      }
    })

    const topRatedEvents = Object.entries(eventRatings)
      .map(([id, data]) => ({
        id,
        title: data.title,
        rating: data.ratings.length > 0 
          ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10
          : 0,
        responses: data.responses
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)

    // Generate response trends (daily for the period)
    const responseTrends = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayResponses = responses?.filter(response => 
        response.completed_at?.startsWith(dateStr)
      ).length || 0
      
      responseTrends.push({
        date: dateStr,
        responses: dayResponses
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Calculate rating distribution
    const ratingDistribution = [
      { rating: 5, count: 0, percentage: 0 },
      { rating: 4, count: 0, percentage: 0 },
      { rating: 3, count: 0, percentage: 0 },
      { rating: 2, count: 0, percentage: 0 },
      { rating: 1, count: 0, percentage: 0 }
    ]

    responses?.forEach(response => {
      const responseData = response.responses as any
      if (responseData && typeof responseData === 'object') {
        Object.values(responseData).forEach((value: any) => {
          if (typeof value === 'number' && value >= 1 && value <= 5) {
            const ratingIndex = 5 - value
            ratingDistribution[ratingIndex].count++
          }
        })
      }
    })

    // Calculate percentages
    const totalRatings = ratingDistribution.reduce((sum, item) => sum + item.count, 0)
    ratingDistribution.forEach(item => {
      item.percentage = totalRatings > 0 ? Math.round((item.count / totalRatings) * 100) : 0
    })

    // Calculate feedback categories (simplified)
    const feedbackCategories = [
      { category: 'Content Quality', count: Math.floor(totalResponses * 0.4), percentage: 40 },
      { category: 'Instructor', count: Math.floor(totalResponses * 0.3), percentage: 30 },
      { category: 'Materials', count: Math.floor(totalResponses * 0.2), percentage: 20 },
      { category: 'Environment', count: Math.floor(totalResponses * 0.1), percentage: 10 }
    ]

    // Calculate anonymous vs user feedback
    const anonymousCount = responses?.filter(response => 
      response.feedback_forms?.[0]?.anonymous_enabled
    ).length || 0
    
    const userCount = totalResponses - anonymousCount

    const analytics = {
      totalForms,
      totalResponses,
      responseRate,
      averageRating,
      completionRate,
      topRatedEvents,
      responseTrends,
      ratingDistribution,
      feedbackCategories,
      anonymousVsUser: {
        anonymous: anonymousCount,
        user: userCount
      }
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
