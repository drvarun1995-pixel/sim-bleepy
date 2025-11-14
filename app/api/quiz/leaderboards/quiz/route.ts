import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { resolveUserAvatar } from '@/lib/quiz/avatar'

export const dynamic = 'force-dynamic'

async function fetchLiveLeaderboard(limit: number) {
  const { data, error } = await supabaseAdmin
    .from('quiz_user_xp')
    .select(
      `
        user_id,
        total_xp,
        current_level,
        level_progress,
        users!inner (
          id,
          name,
          profile_picture_url,
          avatar_type,
          avatar_asset,
          avatar_thumbnail,
          show_quiz_leaderboard
        )
      `
    )
    .order('total_xp', { ascending: false })
    .eq('users.show_quiz_leaderboard', true)
    .limit(limit)

  if (error) {
    throw error
  }

  return (data || []).map((entry: any, index: number) => ({
    rank: index + 1,
    total_xp: entry.total_xp,
    current_level: entry.current_level,
    level_progress: entry.level_progress,
    user: {
      id: entry.users?.id,
      name: entry.users?.name || 'Anonymous',
      avatar: resolveUserAvatar(entry.users) || null,
    },
  }))
}

async function fetchSnapshotLeaderboard(period: string, limit: number) {
  const { data, error } = await supabaseAdmin
    .from('quiz_leaderboard_snapshots')
    .select(
      `
        rank,
        total_xp,
        user_id,
        users!inner (
          id,
          name,
          profile_picture_url,
          avatar_type,
          avatar_asset,
          avatar_thumbnail,
          show_quiz_leaderboard
        )
      `
    )
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(limit)

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return null
  }

  return data.map((entry: any) => ({
    rank: entry.rank,
    total_xp: entry.total_xp,
    current_level: null,
    level_progress: null,
    user: {
      id: entry.users?.id,
      name: entry.users?.name || 'Anonymous',
      avatar: resolveUserAvatar(entry.users) || null,
    },
  }))
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all_time'
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)

    let leaderboard
    if (period === 'all_time') {
      leaderboard = await fetchLiveLeaderboard(limit)
    } else {
      leaderboard = await fetchSnapshotLeaderboard(period, limit)
      if (!leaderboard) {
        leaderboard = await fetchLiveLeaderboard(limit)
      }
    }

    return NextResponse.json({
      leaderboard,
      period,
      source: period === 'all_time' ? 'live' : 'snapshot',
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/leaderboards/quiz:', error)
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}


