import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get scenarios completed count
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select('id')
      .eq('user_id', user.id)
      .not('overall_band', 'is', null)

    const scenariosCompleted = attempts ? attempts.length : 0

    // Get achievements earned count
    const { data: achievements, error: achievementsError } = await supabaseAdmin
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_completed', true)

    const achievementsEarned = achievements ? achievements.length : 0

    // Get current streak
    const { data: streak, error: streakError } = await supabaseAdmin
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .eq('streak_type', 'daily_practice')
      .single()

    const currentStreak = streak ? streak.current_streak : 0

    return NextResponse.json({
      scenariosCompleted,
      achievementsEarned,
      currentStreak
    })

  } catch (error) {
    console.error('Error fetching gamification stats:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
