import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Aggregate statistics from database
    const [
      questionsResult,
      practiceSessionsResult,
      challengeSessionsResult,
      practiceUsersResult,
      challengeUsersResult,
      completedSessionsResult,
      averageScoreResult,
      averageTimeResult,
    ] = await Promise.all([
      // Total questions
      supabaseAdmin
        .from('quiz_questions')
        .select('id', { count: 'exact', head: true }),

      // Total practice sessions
      supabaseAdmin
        .from('quiz_practice_sessions')
        .select('id', { count: 'exact', head: true }),

      // Total challenge sessions
      supabaseAdmin
        .from('quiz_challenges')
        .select('id', { count: 'exact', head: true }),

      // Practice session users
      supabaseAdmin
        .from('quiz_practice_sessions')
        .select('user_id'),

      // Challenge participants
      supabaseAdmin
        .from('quiz_challenge_participants')
        .select('user_id'),

      // Completed practice sessions
      supabaseAdmin
        .from('quiz_practice_sessions')
        .select('id')
        .eq('completed', true),

      // Average score from practice sessions
      supabaseAdmin
        .from('quiz_practice_sessions')
        .select('score, correct_count, question_count')
        .eq('completed', true),

      // Average time per question
      supabaseAdmin
        .from('quiz_practice_answers')
        .select('time_taken_seconds')
        .not('time_taken_seconds', 'is', null),
    ])

    const totalQuestions = questionsResult.count || 0
    const totalPracticeSessions = practiceSessionsResult.count || 0
    const totalChallengeSessions = challengeSessionsResult.count || 0
    const totalSessions = totalPracticeSessions + totalChallengeSessions

    // Calculate unique users
    const practiceUserIds = practiceUsersResult.data?.map((s: any) => s.user_id) || []
    const challengeUserIds = challengeUsersResult.data?.map((s: any) => s.user_id) || []
    const uniqueUserIds = new Set([...practiceUserIds, ...challengeUserIds])
    const totalUsers = uniqueUserIds.size

    // Calculate average score
    const scores = averageScoreResult.data || []
    let averageScore = 0
    if (scores.length > 0) {
      const totalScore = scores.reduce((sum: number, s: any) => {
        if (s.question_count > 0) {
          return sum + (s.correct_count / s.question_count) * 100
        }
        return sum
      }, 0)
      averageScore = totalScore / scores.length
    }

    // Calculate completion rate
    const completedSessions = completedSessionsResult.data?.length || 0
    const completionRate = totalPracticeSessions > 0
      ? (completedSessions / totalPracticeSessions) * 100
      : 0

    // Calculate average time per question
    const timeData = averageTimeResult.data || []
    let averageTime = 0
    if (timeData.length > 0) {
      const totalTime = timeData.reduce((sum: number, t: any) => sum + (t.time_taken_seconds || 0), 0)
      averageTime = totalTime / timeData.length
    }

    return NextResponse.json({
      stats: {
        totalQuestions,
        totalSessions,
        totalUsers,
        averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
        completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
        averageTime: Math.round(averageTime * 10) / 10, // Round to 1 decimal (in seconds)
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

