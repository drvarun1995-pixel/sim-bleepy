import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { fetchQuizXp } from '@/lib/quiz/quizXp'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, show_quiz_leaderboard')
      .eq('email', session.user.email)
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const xp = await fetchQuizXp(user.id)

    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('quiz_xp_transactions')
      .select('id, amount, reason, source_type, source_id, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (transactionsError) {
      console.error('Failed to load quiz XP transactions:', transactionsError)
    }

    return NextResponse.json({
      xp,
      leaderboardOptIn: !!user.show_quiz_leaderboard,
      transactions: transactions || [],
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/xp:', error)
    return NextResponse.json({ error: 'Failed to load XP' }, { status: 500 })
  }
}


