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

    // Get user's level data
    const { data: levelData, error: levelError } = await supabaseAdmin
      .from('user_levels')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no level data exists, create default level
    if (levelError || !levelData) {
      const { data: newLevelData, error: createError } = await supabaseAdmin
        .from('user_levels')
        .insert({
          user_id: user.id,
          current_level: 1,
          total_xp: 0,
          level_progress: 0,
          title: 'Medical Student'
        })
        .select('*')
        .single()

      if (createError || !newLevelData) {
        // Return default data if creation fails
        return NextResponse.json({
          currentLevel: 1,
          totalXp: 0,
          xpForNext: 100,
          progress: 0,
          title: 'Medical Student',
          levelProgress: 0
        })
      }

      return NextResponse.json({
        currentLevel: newLevelData.current_level,
        totalXp: newLevelData.total_xp,
        xpForNext: 100,
        progress: newLevelData.level_progress,
        title: newLevelData.title,
        levelProgress: newLevelData.level_progress
      })
    }

    // Calculate XP needed for next level
    const xpForNext = calculateXPForNextLevel(levelData.current_level)
    const progress = ((levelData.total_xp % xpForNext) / xpForNext) * 100

    return NextResponse.json({
      currentLevel: levelData.current_level,
      totalXp: levelData.total_xp,
      xpForNext: xpForNext - (levelData.total_xp % xpForNext),
      progress: progress,
      title: levelData.title,
      levelProgress: levelData.level_progress
    })

  } catch (error) {
    console.error('Error fetching level data:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function calculateXPForNextLevel(currentLevel: number): number {
  // XP required for each level (increases with level)
  if (currentLevel < 5) return 100
  if (currentLevel < 10) return 200
  if (currentLevel < 15) return 300
  return 400
}