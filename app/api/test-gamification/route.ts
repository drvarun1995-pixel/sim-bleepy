import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing gamification system...')
    
    // 1. Check if gamification tables exist
    const tables = ['user_levels', 'achievements', 'user_achievements', 'user_streaks', 'xp_transactions']
    const tableResults: Record<string, any> = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1)
        
        tableResults[table] = {
          exists: !error,
          error: error?.message || null
        }
      } catch (err) {
        tableResults[table] = {
          exists: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
    
    // 2. Check if gamification functions exist
    let awardXpFunction: { exists: boolean; error: string | null } = { exists: false, error: null }
    let checkAchievementsFunction: { exists: boolean; error: string | null } = { exists: false, error: null }
    
    try {
      const { data, error } = await supabaseAdmin.rpc('award_xp', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_xp_amount: 0,
        p_transaction_type: 'test',
        p_source_id: null,
        p_source_type: null,
        p_description: 'Test function call'
      })
      
      awardXpFunction = {
        exists: !error,
        error: error?.message || null
      }
    } catch (err) {
      awardXpFunction = {
        exists: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }
    
    try {
      const { data, error } = await supabaseAdmin.rpc('check_achievements', {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      })
      
      checkAchievementsFunction = {
        exists: !error,
        error: error?.message || null
      }
    } catch (err) {
      checkAchievementsFunction = {
        exists: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }
    
    // 3. Check users and attempts
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .limit(5)
    
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select('id, user_id, station_slug, scores, overall_band, created_at')
      .limit(5)
    
    const { data: userLevels, error: levelsError } = await supabaseAdmin
      .from('user_levels')
      .select('*')
      .limit(5)
    
    return NextResponse.json({
      success: true,
      tables: tableResults,
      functions: {
        award_xp: awardXpFunction,
        check_achievements: checkAchievementsFunction
      },
      data: {
        users: {
          count: users?.length || 0,
          error: usersError?.message || null,
          data: users || []
        },
        attempts: {
          count: attempts?.length || 0,
          error: attemptsError?.message || null,
          data: attempts || []
        },
        userLevels: {
          count: userLevels?.length || 0,
          error: levelsError?.message || null,
          data: userLevels || []
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Error in gamification test:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: error
    }, { status: 500 })
  }
}
