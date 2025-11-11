import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get leaderboards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all_time'
    const category = searchParams.get('category') || null
    const difficulty = searchParams.get('difficulty') || null
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabaseAdmin
      .from('quiz_leaderboards')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .eq('period', period)

    if (category) {
      query = query.eq('category', category)
    } else {
      query = query.is('category', null)
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    } else {
      query = query.is('difficulty', null)
    }

    query = query.order('total_points', { ascending: false })
      .limit(limit)

    const { data: leaderboard, error } = await query

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Add rank
    const leaderboardWithRank = leaderboard?.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })) || []

    return NextResponse.json({ leaderboard: leaderboardWithRank })
  } catch (error) {
    console.error('Error in GET /api/quiz/leaderboards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


