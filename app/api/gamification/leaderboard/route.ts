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

    // Get leaderboard data using service role to bypass RLS
    // First, let's get all users and their levels
    const { data: leaderboard, error: leaderboardError } = await supabaseAdmin
      .from('user_levels')
      .select(`
        *,
        users!inner (
          id,
          email,
          name
        )
      `)
      .order('total_xp', { ascending: false })
      .limit(50)

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError)
      console.error('Leaderboard error details:', leaderboardError)
      
      // Fallback: try to get users without user_levels
      const { data: allUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .limit(50)
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
      }
      
      // Create leaderboard with default values for users without levels
      const fallbackLeaderboard = allUsers?.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        name: user.name || user.email?.split('@')[0] || 'Anonymous',
        email: user.email,
        currentLevel: 1,
        totalXp: 0,
        title: 'Medical Student',
        isCurrentUser: user.email === session.user?.email
      })) || []
      
      return NextResponse.json({
        type: 'total_xp',
        period: {
          start: 'All Time',
          end: 'Present'
        },
        leaderboard: fallbackLeaderboard,
        currentUser: {
          rank: fallbackLeaderboard.find(entry => entry.isCurrentUser)?.rank || null,
          score: fallbackLeaderboard.find(entry => entry.isCurrentUser)?.totalXp || 0
        }
      })
    }

    // Process leaderboard data
    const processedLeaderboard = leaderboard?.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      name: entry.users?.name || entry.users?.email?.split('@')[0] || 'Anonymous',
      email: entry.users?.email,
      currentLevel: entry.current_level,
      totalXp: entry.total_xp,
      title: entry.title,
      isCurrentUser: entry.users?.email === session.user?.email
    })) || []

    // Get current user's rank
    const currentUserRank = processedLeaderboard.find(entry => entry.isCurrentUser)?.rank || null

    return NextResponse.json({
      type: 'total_xp',
      period: {
        start: 'All Time',
        end: 'Present'
      },
      leaderboard: processedLeaderboard,
      currentUser: {
        rank: currentUserRank,
        score: processedLeaderboard.find(entry => entry.isCurrentUser)?.totalXp || 0
      }
    })

  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}