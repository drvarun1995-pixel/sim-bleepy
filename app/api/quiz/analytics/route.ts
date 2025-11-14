import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { USER_ROLES } from '@/lib/roles'

export const dynamic = 'force-dynamic'

type PerformanceBucket = {
  date: string
  practiceSessions: number
  challengesHosted: number
}

type CategoryBucket = {
  category: string
  sessions: number
}

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

    if (!user?.role || ![USER_ROLES.ADMIN, USER_ROLES.MEDED_TEAM].includes(user.role)) {
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
      recentChallengesResult,
      recentPracticeResult,
      performancePracticeResult,
      performanceChallengeResult,
      categorySessionsResult,
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
      supabaseAdmin
        .from('quiz_challenges')
        .select(`
          id,
          code,
          host_id,
          created_at,
          status,
          selected_categories,
          selected_difficulties,
          question_count,
          time_limit,
          users!quiz_challenges_host_id_fkey ( name, email ),
          participants:quiz_challenge_participants (
            id,
            status,
            users (
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('quiz_practice_sessions')
        .select(`
          id,
          started_at,
          completed,
          category,
          difficulty,
          time_limit,
          question_count,
          score,
          user_id,
          users (
            name,
            email
          )
        `)
        .order('started_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('quiz_practice_sessions')
        .select('id, started_at')
        .gte('started_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin
        .from('quiz_challenges')
        .select('id, created_at')
        .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin
        .from('quiz_practice_sessions')
        .select('category')
        .not('category', 'is', null),
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

    const recentChallenges =
      recentChallengesResult.data?.map((challenge: any) => ({
        id: challenge.id,
        code: challenge.code,
        status: challenge.status,
        createdAt: challenge.created_at,
        questionCount: challenge.question_count,
        timeLimit: challenge.time_limit,
        categories: challenge.selected_categories || [],
        difficulties: challenge.selected_difficulties || [],
        host: {
          name: challenge.users?.name || 'Unknown host',
          email: challenge.users?.email || '',
        },
        participants: (challenge.participants || []).map((participant: any) => ({
          id: participant.id,
          name: participant.users?.name || 'Unknown player',
          email: participant.users?.email || '',
          status: participant.status,
        })),
      })) || []

    const recentPracticeSessions =
      recentPracticeResult.data?.map((session: any) => ({
        id: session.id,
        startedAt: session.started_at,
        completed: session.completed,
        category: session.category || 'Uncategorised',
        difficulty: session.difficulty || 'mixed',
        timeLimit: session.time_limit,
        questionCount: session.question_count,
        score: session.score,
        user: {
          name: session.users?.name || 'Unknown',
          email: session.users?.email || '',
        },
      })) || []

    const performanceBuckets: Record<string, PerformanceBucket> = {}
    const performanceRange = 14
    for (let i = performanceRange - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().slice(0, 10)
      performanceBuckets[key] = {
        date: key,
        practiceSessions: 0,
        challengesHosted: 0,
      }
    }

    performancePracticeResult.data?.forEach((session: any) => {
      const key = session.started_at?.slice(0, 10)
      if (key && performanceBuckets[key]) {
        performanceBuckets[key].practiceSessions += 1
      }
    })
    performanceChallengeResult.data?.forEach((challenge: any) => {
      const key = challenge.created_at?.slice(0, 10)
      if (key && performanceBuckets[key]) {
        performanceBuckets[key].challengesHosted += 1
      }
    })

    const performanceTrends = Object.values(performanceBuckets)

    const categoryCounts: Record<string, number> = {}
    categorySessionsResult.data?.forEach((session: any) => {
      const key = session.category || 'Uncategorised'
      categoryCounts[key] = (categoryCounts[key] || 0) + 1
    })

    const totalCategorySessions = Object.values(categoryCounts).reduce(
      (sum, value) => sum + value,
      0
    )
    const categoryDistribution: CategoryBucket[] = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, sessions]) => ({
        category,
        sessions,
        percentage: totalCategorySessions ? Math.round((sessions / totalCategorySessions) * 100) : 0,
      }))

    return NextResponse.json({
      stats: {
        totalQuestions,
        totalSessions,
        totalUsers,
        averageScore: Math.round(averageScore * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        averageTime: Math.round(averageTime * 10) / 10,
      },
      challengeLogs: recentChallenges,
      practiceLogs: recentPracticeSessions,
      performanceTrends,
      categoryDistribution,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Delete all analytics data (but preserve questions, categories, and campaigns)
    // Order matters due to foreign key constraints
    // We use a condition that matches all records by using a very old date
    const oldDate = '1970-01-01'
    
    const errors: string[] = []
    
    // 1. Delete practice answers first (due to foreign key to sessions)
    // Since answered_at has DEFAULT NOW(), all records will have a timestamp >= oldDate
    const { error: practiceAnswersError } = await supabaseAdmin
      .from('quiz_practice_answers')
      .delete()
      .gte('answered_at', oldDate)

    if (practiceAnswersError) {
      console.error('Error deleting practice answers:', practiceAnswersError)
      errors.push(`Practice answers: ${practiceAnswersError.message}`)
    }

    // 2. Delete practice sessions (CASCADE will auto-delete remaining answers)
    const { error: practiceSessionsError } = await supabaseAdmin
      .from('quiz_practice_sessions')
      .delete()
      .gte('started_at', oldDate)

    if (practiceSessionsError) {
      console.error('Error deleting practice sessions:', practiceSessionsError)
      errors.push(`Practice sessions: ${practiceSessionsError.message}`)
    }

    // 3. Delete challenge answers
    const { error: challengeAnswersError } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .delete()
      .gte('answered_at', oldDate)

    if (challengeAnswersError) {
      console.error('Error deleting challenge answers:', challengeAnswersError)
      errors.push(`Challenge answers: ${challengeAnswersError.message}`)
    }

    // 4. Delete challenge participants (CASCADE will auto-delete answers)
    const { error: participantsError } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .delete()
      .gte('joined_at', oldDate)

    if (participantsError) {
      console.error('Error deleting challenge participants:', participantsError)
      errors.push(`Challenge participants: ${participantsError.message}`)
    }

    // 5. Delete challenges (CASCADE will auto-delete participants and answers)
    const { error: challengesError } = await supabaseAdmin
      .from('quiz_challenges')
      .delete()
      .gte('created_at', oldDate)

    if (challengesError) {
      console.error('Error deleting challenges:', challengesError)
      errors.push(`Challenges: ${challengesError.message}`)
    }

    // 6. Delete leaderboards
    const { error: leaderboardsError } = await supabaseAdmin
      .from('quiz_leaderboards')
      .delete()
      .gte('last_updated', oldDate)

    if (leaderboardsError) {
      console.error('Error deleting leaderboards:', leaderboardsError)
      errors.push(`Leaderboards: ${leaderboardsError.message}`)
    }

    // 7. Delete user progress
    // User progress doesn't have a created_at timestamp, so we need to delete all records
    // We'll delete in batches by fetching and deleting until no more records exist
    let hasMoreProgress = true
    let progressBatchCount = 0
    const maxBatches = 100 // Safety limit to prevent infinite loops
    
    while (hasMoreProgress && progressBatchCount < maxBatches) {
      // Fetch a batch of user progress IDs
      const { data: progressBatch, error: fetchError } = await supabaseAdmin
        .from('quiz_user_progress')
        .select('id')
        .limit(500) // Delete 500 at a time
      
      if (fetchError) {
        console.error('Error fetching user progress:', fetchError)
        errors.push(`User progress: ${fetchError.message}`)
        break
      }
      
      if (!progressBatch || progressBatch.length === 0) {
        hasMoreProgress = false
        break
      }
      
      // Delete this batch
      const progressIds = progressBatch.map((p: any) => p.id)
      const { error: deleteError } = await supabaseAdmin
        .from('quiz_user_progress')
        .delete()
        .in('id', progressIds)
      
      if (deleteError) {
        console.error('Error deleting user progress batch:', deleteError)
        errors.push(`User progress: ${deleteError.message}`)
        break
      }
      
      progressBatchCount++
      
      // If we got fewer than 500 records, we've reached the end
      if (progressBatch.length < 500) {
        hasMoreProgress = false
      }
    }
    
    if (progressBatchCount >= maxBatches) {
      errors.push('User progress: Reached maximum batch limit. Some records may remain.')
    }

    // If there were any errors, return them
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some analytics data could not be cleared',
          details: errors,
          partialSuccess: true
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'All analytics data has been cleared successfully. Questions, categories, and campaigns have been preserved.',
    })
  } catch (error: any) {
    console.error('Error clearing analytics:', error)
    return NextResponse.json(
      { error: 'Failed to clear analytics', details: error.message },
      { status: 500 }
    )
  }
}
