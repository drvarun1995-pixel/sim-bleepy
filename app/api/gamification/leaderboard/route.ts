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

    const { data: viewer, error: viewerError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_public, public_slug, public_display_name')
      .eq('email', session.user.email)
      .single()

    if (viewerError || !viewer) {
      console.error('Failed to fetch viewer profile for leaderboard access:', viewerError)
      return NextResponse.json({ error: 'Failed to verify user profile' }, { status: 500 })
    }

    const viewerIsPublic = !!viewer.is_public

    // Get leaderboard data using service role to bypass RLS
    const { data: leaderboard, error: leaderboardError } = await supabaseAdmin
      .from('user_levels')
      .select(`
        *,
        users!inner (
          id,
          email,
          name,
          is_public,
          public_display_name,
          public_slug
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
        .select('id, email, name, is_public, public_display_name, public_slug')
        .limit(50)
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
      }
      
      // Create leaderboard with default values for users without levels
      const fallbackLeaderboard =
        allUsers
          ?.filter((user) => user.is_public)
          .map((user, index) => ({
            rank: index + 1,
            userId: user.id,
            name:
              user.public_display_name ||
              user.name ||
              user.email?.split('@')[0] ||
              'Bleepy User',
            email: user.email,
            currentLevel: 1,
            totalXp: 0,
            title: 'Medical Student',
            publicSlug: user.public_slug || null,
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
          rank: viewerIsPublic
            ? fallbackLeaderboard.find(entry => entry.isCurrentUser)?.rank || null
            : null,
          score: viewerIsPublic
            ? fallbackLeaderboard.find(entry => entry.isCurrentUser)?.totalXp || 0
            : 0
        },
        viewer: {
          isPublic: viewerIsPublic,
          publicSlug: viewer.public_slug || null
        }
      })
    }

    // If we have leaderboard data but it's empty, try the fallback approach
    if (!leaderboard || leaderboard.length === 0) {
      console.log('No leaderboard data found, trying fallback approach...')
      
      const { data: allUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, is_public, public_display_name, public_slug')
        .limit(50)
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
      }
      
      // Create leaderboard with default values for users without levels
      const fallbackLeaderboard =
        allUsers
          ?.filter((user) => user.is_public)
          .map((user, index) => ({
            rank: index + 1,
            userId: user.id,
            name:
              user.public_display_name ||
              user.name ||
              user.email?.split('@')[0] ||
              'Bleepy User',
            email: user.email,
            currentLevel: 1,
            totalXp: 0,
            title: 'Medical Student',
            publicSlug: user.public_slug || null,
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
          rank: viewerIsPublic
            ? fallbackLeaderboard.find(entry => entry.isCurrentUser)?.rank || null
            : null,
          score: viewerIsPublic
            ? fallbackLeaderboard.find(entry => entry.isCurrentUser)?.totalXp || 0
            : 0
        },
        viewer: {
          isPublic: viewerIsPublic,
          publicSlug: viewer.public_slug || null
        }
      })
    }

    // Process leaderboard data
    const processedLeaderboard = (leaderboard || [])
      .filter((entry) => entry.users?.is_public)
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.user_id,
        name:
          entry.users?.public_display_name ||
          entry.users?.name ||
          entry.users?.email?.split('@')[0] ||
          'Bleepy User',
        email: entry.users?.email,
        currentLevel: entry.current_level,
        totalXp: entry.total_xp,
        title: entry.title,
        publicSlug: entry.users?.public_slug || null,
        isCurrentUser: entry.users?.email === session.user?.email
      }))

    // Re-rank after filtering private profiles
    const rankedLeaderboard = processedLeaderboard.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }))

    // Get current user's rank
    const currentUserRank = viewerIsPublic
      ? rankedLeaderboard.find(entry => entry.isCurrentUser)?.rank || null
      : null

    return NextResponse.json({
      type: 'total_xp',
      period: {
        start: 'All Time',
        end: 'Present'
      },
      leaderboard: rankedLeaderboard,
      currentUser: {
        rank: currentUserRank,
        score: viewerIsPublic
          ? rankedLeaderboard.find(entry => entry.isCurrentUser)?.totalXp || 0
          : 0
      },
      viewer: {
        isPublic: viewerIsPublic,
        publicSlug: viewer.public_slug || null
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