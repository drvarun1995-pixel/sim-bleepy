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


    const { data: challengeParticipantsData } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('id, final_score, questions_answered, correct_answers, average_time_seconds, completed_at')
      .eq('user_id', user.id)
    const challengeParticipants = challengeParticipantsData ?? []
    const participantIds = challengeParticipants.map((participant: any) => participant.id).filter(Boolean)

    let challengeAnswers: { question_id: string | null; is_correct: boolean | null }[] = []
    if (participantIds.length > 0) {
      const chunkSize = 200
      for (let i = 0; i < participantIds.length; i += chunkSize) {
        const chunk = participantIds.slice(i, i + chunkSize)
        const { data } = await supabaseAdmin
          .from('quiz_challenge_answers')
          .select('question_id, is_correct')
          .in('participant_id', chunk)
        if (data) {
          challengeAnswers = challengeAnswers.concat(data)
        }
      }
    }

    const challengeQuestionCategories = new Map<string, string>()
    const questionIds = Array.from(
      new Set(
        challengeAnswers
          .map((answer) => answer.question_id)
          .filter((value): value is string => typeof value === 'string')
      )
    )
    if (questionIds.length > 0) {
      const chunkSize = 200
      for (let i = 0; i < questionIds.length; i += chunkSize) {
        const chunk = questionIds.slice(i, i + chunkSize)
        const { data } = await supabaseAdmin
          .from('quiz_questions')
          .select('id, category')
          .in('id', chunk)
        if (data) {
          data.forEach((question: any) => {
            if (!question?.id) return
            challengeQuestionCategories.set(
              question.id,
              question.category || 'Challenge practice'
            )
          })
        }
      }
    }

    const quizXp = await fetchQuizXp(user.id)

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
    const addCategorySample = (
      category: string | null | undefined,
      correctAmount: number,
      totalAmount: number
    ) => {
      const key = category || 'General practice'
      const entry = categoryTotals.get(key) || { correct: 0, total: 0 }
      entry.correct += correctAmount
      entry.total += totalAmount
      categoryTotals.set(key, entry)
    }

    practiceSessions.forEach((session: any) => {
      addCategorySample(session.category, session.correct_count || 0, session.question_count || 0)
    })

    challengeAnswers.forEach((answer) => {
      if (!answer?.question_id) return
      const category = challengeQuestionCategories.get(answer.question_id) || 'Challenge practice'
      addCategorySample(category, answer.is_correct ? 1 : 0, 1)
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
    if (user.show_quiz_leaderboard && quizXp.total_xp > 0) {
      const { count } = await supabaseAdmin
        .from('quiz_user_xp')
        .select('user_id, users!inner(show_quiz_leaderboard)', { count: 'exact', head: true })
        .gt('total_xp', quizXp.total_xp)
        .eq('users.show_quiz_leaderboard', true)

      leaderboardRank = typeof count === 'number' ? count + 1 : 1
    }

    const practiceStats = {
      sessions: practiceSessions.length,
      questions: practiceQuestions,
      correct: practiceSessions.reduce((sum: number, s: any) => sum + (s.correct_count || 0), 0),
      points: practicePoints,
    }

    const challengeStats = {
      challenges: challengeParticipants.length,
      questions: challengeQuestions,
      correct: challengeParticipants.reduce((sum: number, p: any) => sum + (p.correct_answers || 0), 0),
      points: challengePoints,
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
      xpLevel: {
        total_xp: quizXp.total_xp,
        current_level: quizXp.current_level,
        progress: quizXp.level_progress,
        xp_to_next: quizXp.xp_to_next,
      },
      practiceStats,
      challengeStats,
      leaderboardOptIn: !!user.show_quiz_leaderboard,
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

