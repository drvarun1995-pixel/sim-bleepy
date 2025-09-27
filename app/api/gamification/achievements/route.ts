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

    // Get user's achievements
    const { data: userAchievements, error: achievementsError } = await supabaseAdmin
      .from('user_achievements')
      .select(`
        *,
        achievements (
          id,
          code,
          name,
          description,
          icon,
          category,
          xp_reward,
          badge_color
        )
      `)
      .eq('user_id', user.id)
      .eq('is_completed', true)

    // Get all available achievements
    const { data: allAchievements, error: allAchievementsError } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (achievementsError || allAchievementsError) {
      console.error('Error fetching achievements:', achievementsError || allAchievementsError)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    // Process achievements data
    const earnedAchievements = userAchievements?.map(ua => ({
      id: ua.id,
      code: ua.achievements?.code || '',
      name: ua.achievements?.name || 'Unknown Achievement',
      description: ua.achievements?.description || '',
      icon: ua.achievements?.icon || '🏆',
      category: ua.achievements?.category || 'completion',
      xpReward: ua.achievements?.xp_reward || 0,
      badgeColor: ua.achievements?.badge_color || '#FFD700',
      earnedAt: ua.earned_at,
      isCompleted: ua.is_completed
    })).filter(ach => ach.code) || [] // Filter out achievements with missing data

    const availableAchievements = allAchievements?.map(ach => {
      const earned = earnedAchievements.find(ea => ea.code === ach.code)
      return {
        id: ach.id,
        code: ach.code,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        xpReward: ach.xp_reward,
        badgeColor: ach.badge_color,
        earnedAt: earned?.earnedAt || null,
        isCompleted: earned?.isCompleted || false
      }
    }) || []

    return NextResponse.json({
      earned: earnedAchievements,
      available: availableAchievements,
      total: availableAchievements.length,
      earned: earnedAchievements.length
    })

  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}