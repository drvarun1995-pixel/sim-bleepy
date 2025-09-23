import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { stationConfigs } from '@/utils/stationConfigs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    // Get user ID from users table first
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', userEmail)
      .single()

    if (userError || !user) {
      console.error('User error:', userError)
      return NextResponse.json({ 
        error: 'User not found',
        stats: {
          totalStations: 0,
          completedStations: 0,
          averageScore: 0,
          role: 'student',
          recentActivity: []
        }
      })
    }

    // Get profile info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('email', userEmail)
      .single()

    const userRole = profile?.role || 'student'

    // Get total stations count - only count stations that are configured in the code
    const { data: stations, error: stationsError } = await supabaseAdmin
      .from('stations')
      .select('slug')
    
    // Only count stations that are actually configured in stationConfigs
    const totalStations = Object.keys(stationConfigs).length

    // Get user's attempts and calculate stats
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select(`
        id,
        station_slug,
        start_time,
        end_time,
        duration,
        overall_band,
        scores,
        created_at,
        stations!inner(title)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError)
    }

    // Calculate statistics - count unique stations completed
    const uniqueStationsCompleted = new Set(attempts?.map(attempt => attempt.station_slug) || [])
    const completedStations = uniqueStationsCompleted.size
    
    // Calculate average score from all attempts (including 0 scores)
    const averageScore = attempts && attempts.length > 0 
      ? attempts.reduce((sum, attempt) => {
          const scores = attempt.scores as any
          const totalScore = scores?.totalScore || 0
          return sum + totalScore
        }, 0) / attempts.length
      : 0

    // Format recent activity
    const recentActivity = attempts?.slice(0, 5).map(attempt => {
      const scores = attempt.scores as any
      const totalScore = scores?.totalScore || 0
      const maxScore = scores?.maxScore || 12
      const hasScore = scores && scores.totalScore !== null && scores.totalScore !== undefined
      
      return {
        id: attempt.id,
        stationName: (attempt.stations as any)?.title || 'Unknown Station',
        date: attempt.created_at,
        score: totalScore,
        maxScore: maxScore,
        status: hasScore ? (attempt.overall_band === 'PASS' ? 'PASS' : 'FAIL') : 'INCOMPLETE',
        duration: attempt.duration || 0,
        scores: scores // Include detailed scores for the modal
      }
    }) || []

    const stats = {
      totalStations,
      completedStations,
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
      role: userRole,
      recentActivity
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error in user stats API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
