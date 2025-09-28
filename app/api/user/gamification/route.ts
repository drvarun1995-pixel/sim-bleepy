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
      return NextResponse.json({ 
        error: 'User not found',
        gamification: {
          level: { current_level: 1, total_xp: 0, level_progress: 0, title: 'Medical Student' },
          achievements: 0,
          streak: { current_streak: 0, longest_streak: 0 },
          recentXP: []
        }
      })
    }

    // Get gamification data
    const [levelResult, achievementsResult, streakResult, xpResult] = await Promise.all([
      // Get level data
      supabaseAdmin
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      
      // Get achievement count
      supabaseAdmin
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_completed', true),
      
      // Get streak data
      supabaseAdmin
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('streak_type', 'daily_practice')
        .single(),
      
      // Get recent XP transactions with deduplication
      supabaseAdmin
        .from('xp_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20) // Get more to allow for deduplication
    ])

    // Deduplicate XP transactions based on description and timestamp
    const rawXPData = xpResult.data || []
    const deduplicatedXP = rawXPData.filter((transaction, index, array) => {
      // Keep only the first occurrence of each unique description within a 5-minute window
      const isDuplicate = array.slice(0, index).some(prevTransaction => {
        const timeDiff = Math.abs(
          new Date(transaction.created_at).getTime() - 
          new Date(prevTransaction.created_at).getTime()
        )
        return (
          transaction.description === prevTransaction.description &&
          transaction.xp_amount === prevTransaction.xp_amount &&
          timeDiff < 5 * 60 * 1000 // 5 minutes in milliseconds
        )
      })
      return !isDuplicate
    }).slice(0, 10) // Limit to 10 after deduplication

    console.log('🎮 XP Transactions:', {
      total: rawXPData.length,
      deduplicated: deduplicatedXP.length,
      rawData: rawXPData.slice(0, 3),
      deduplicatedData: deduplicatedXP.slice(0, 3)
    })

    const gamificationData = {
      level: levelResult.data || { 
        current_level: 1, 
        total_xp: 0, 
        level_progress: 0, 
        title: 'Medical Student' 
      },
      achievements: achievementsResult.count || 0,
      streak: streakResult.data || { 
        current_streak: 0, 
        longest_streak: 0 
      },
      recentXP: deduplicatedXP
    }

    return NextResponse.json({ gamification: gamificationData })

  } catch (error) {
    console.error('Error fetching gamification data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch gamification data',
      details: error instanceof Error ? error.message : 'Unknown error',
      gamification: {
        level: { current_level: 1, total_xp: 0, level_progress: 0, title: 'Medical Student' },
        achievements: 0,
        streak: { current_streak: 0, longest_streak: 0 },
        recentXP: []
      }
    }, { status: 500 })
  }
}
