import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: practiceSessionsData } = await supabaseAdmin
      .from('quiz_practice_sessions')
      .select('id, score, question_count, correct_count, completed, completed_at, category')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
    const practiceSessions = practiceSessionsData ?? []

    const sessionIds = (practiceSessions ?? []).map((session: any) => session.id).filter(Boolean)

    let practiceAnswers: any[] = []
    if (sessionIds.length > 0) {
      const chunkSize = 200
      for (let i = 0; i < sessionIds.length; i += chunkSize) {
        const chunk = sessionIds.slice(i, i + chunkSize)
        const { data } = await supabaseAdmin
          .from('quiz_practice_answers')
          .select('time_taken_seconds, is_correct, answered_at')
          .in('session_id', chunk)
        if (data) {
          practiceAnswers = practiceAnswers.concat(data)
        }
      }
    }

    const { data: challengeParticipants = [] } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('final_score, questions_answered, correct_answers, average_time_seconds, completed_at')
      .eq('user_id', user.id)

    const { data: levelData } = await supabaseAdmin
      .from('user_levels')
      .select('total_xp, current_level, title')
      .eq('user_id', user.id)
      .maybeSingle()

    const practicePoints = practiceSessions.reduce(
      (sum: number, session: any) => sum + (session.score || 0),
      0
    )
    const challengePoints = challengeParticipants.reduce(
      (sum: number, participant: any) => sum + (participant.final_score || 0),
      0
    )
    const totalPoints = practicePoints + challengePoints

    const practiceQuestions = practiceSessions.reduce(
      (sum: number, session: any) => sum + (session.question_count || 0),
      0
    )
    const challengeQuestions = challengeParticipants.reduce(
      (sum: number, participant: any) => sum + (participant.questions_answered || 0),
      0
    )
    const totalQuestions = practiceQuestions + challengeQuestions

    const correctAnswers =
      practiceSessions.reduce(
        (sum: number, session: any) => sum + (session.correct_count || 0),
        0
      ) +
      challengeParticipants.reduce(
        (sum: number, participant: any) => sum + (participant.correct_answers || 0),
        0
      )

    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    const practiceTimeSum = practiceAnswers.reduce(
      (sum: number, answer: any) => sum + (answer.time_taken_seconds || 0),
      0
    )
    const practiseAnsweredCount = practiceAnswers.length

    const challengeTimeSum = challengeParticipants.reduce((sum: number, participant: any) => {
      if (!participant.average_time_seconds) return sum
      const answerCount = participant.questions_answered || 0
      return sum + participant.average_time_seconds * answerCount
    }, 0)
    const challengeAnsweredCount = challengeParticipants.reduce(
      (sum: number, participant: any) => sum + (participant.questions_answered || 0),
      0
    )

    const combinedTimeSum = practiceTimeSum + challengeTimeSum
    const combinedAnswerCount = practiseAnsweredCount + challengeAnsweredCount
    const averageTimeSeconds =
      combinedAnswerCount > 0
        ? Math.round((combinedTimeSum / combinedAnswerCount) * 10) / 10
        : 0

    const sortedAnswers = [...practiceAnswers].sort((a, b) => {
      const first = a.answered_at ? new Date(a.answered_at).getTime() : 0
      const second = b.answered_at ? new Date(b.answered_at).getTime() : 0
      return first - second
    })

    let currentStreak = 0
    let bestStreak = 0
    sortedAnswers.forEach((answer) => {
      if (answer.is_correct) {
        currentStreak += 1
        bestStreak = Math.max(bestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })

    const categoryTotals = new Map<string, { correct: number; total: number }>()
    practiceSessions.forEach((session: any) => {
      const category = session.category || 'General practice'
      const entry = categoryTotals.get(category) || { correct: 0, total: 0 }
      entry.correct += session.correct_count || 0
      entry.total += session.question_count || 0
      categoryTotals.set(category, entry)
    })

    let bestCategory: string | null = null
    let bestCategoryAccuracy = 0
    categoryTotals.forEach((value, key) => {
      if (value.total === 0) return
      const categoryAccuracy = value.correct / value.total
      if (categoryAccuracy >= bestCategoryAccuracy) {
        bestCategoryAccuracy = categoryAccuracy
        bestCategory = key
      }
    })

    const lastActivityDates: Date[] = []
    practiceSessions.forEach((session: any) => {
      if (session.completed_at) {
        lastActivityDates.push(new Date(session.completed_at))
      }
    })
    challengeParticipants.forEach((participant: any) => {
      if (participant.completed_at) {
        lastActivityDates.push(new Date(participant.completed_at))
      }
    })
    const lastActivity = lastActivityDates.length
      ? new Date(Math.max(...lastActivityDates.map((date) => date.getTime()))).toISOString()
      : null

    let leaderboardRank: number | null = null
    if (levelData?.total_xp !== undefined) {
      const { count } = await supabaseAdmin
        .from('user_levels')
        .select('id', { count: 'exact', head: true })
        .gt('total_xp', levelData.total_xp)
      leaderboardRank = (count || 0) + 1
    }

    const stats = {
      totalPoints,
      accuracy,
      currentStreak,
      bestStreak,
      questionsAnswered: totalQuestions,
      correctAnswers,
      averageTimeSeconds,
      practiceSessions: practiceSessions.length,
      challengeSessions: challengeParticipants.length,
      totalSessions: practiceSessions.length + challengeParticipants.length,
      bestCategory,
      lastActivity,
      leaderboardRank,
      totalXp: levelData?.total_xp || 0,
      levelTitle: levelData?.title || 'Medical Student',
      hasData:
        totalPoints > 0 ||
        totalQuestions > 0 ||
        practiceSessions.length > 0 ||
        challengeParticipants.length > 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

