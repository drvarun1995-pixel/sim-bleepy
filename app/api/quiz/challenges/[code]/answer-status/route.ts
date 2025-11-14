import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { logInfo } from '@/lib/logger'
import { hasRecordedAnswer } from '@/lib/quiz/answers'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

// GET - Get answer status for current question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { searchParams } = new URL(request.url)
    const questionOrder = parseInt(searchParams.get('question_order') || '1', 10)
    const clientMetaHeader = request.headers.get('x-game-check-meta')
    let clientMeta: Record<string, any> | null = null
    if (clientMetaHeader) {
      try {
        clientMeta = JSON.parse(clientMetaHeader)
      } catch (parseError) {
        console.warn('[answer-status] Failed to parse X-Game-Check-Meta header', {
          clientMetaHeader,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        })
      }
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get challenge
    const { data: challenge } = await supabaseAdmin
      .from('quiz_challenges')
      .select('*')
      .eq('code', code)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 })
    }

    // Get all participants
    const { data: participants } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('id, user_id')
      .eq('challenge_id', challenge.id)
      .eq('status', 'playing')

    console.log('[answer-status] DEBUG: Participants found:', {
      challengeId: challenge.id,
      questionOrder,
      participantsCount: participants?.length || 0,
      participants: participants?.map((p: any) => ({ id: p.id, userId: p.user_id }))
    })

    if (!participants || participants.length === 0) {
      return NextResponse.json({ error: 'No participants found' }, { status: 404 })
    }

    // Get question ID for this question order (try to get from any answer)
    const { data: answerSample } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select('question_id')
      .eq('challenge_id', challenge.id)
      .eq('question_order', questionOrder)
      .not('question_id', 'is', null)
      .limit(1)
      .maybeSingle()

    // If no question found, all participants haven't answered yet
    if (!answerSample || !answerSample.question_id) {
      return NextResponse.json({
        allAnswered: false,
        answeredCount: 0,
        totalCount: participants.length,
        userAnswered: false,
      })
    }

    const questionId = answerSample.question_id

    // Get all answers for this question (including null answers from pre-population)
    // Check answered_at instead of selected_answer to include timeouts (which store null)
    const { data: questionAnswers } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select('participant_id, selected_answer, answered_at, points_earned, time_taken_seconds, is_correct')
      .eq('challenge_id', challenge.id)
      .eq('question_id', questionId)
      .eq('question_order', questionOrder)

    console.log('[answer-status] DEBUG: Question answers found:', {
      questionId,
      questionOrder,
      totalAnswers: questionAnswers?.length || 0,
      answers: questionAnswers?.map((a: any) => ({
        participantId: a.participant_id,
        selectedAnswer: a.selected_answer,
        answeredAt: a.answered_at,
        hasAnsweredAt: a.answered_at !== null
      }))
    })

    // Count answers where answered_at is not null AND after game started
    // This ensures that when timer expires and empty answer is submitted, it's counted as answered
    // But we ignore pre-populated answers that were created before the game started
    const gameStartedAt = challenge.started_at ? new Date(challenge.started_at) : null
    
    // Add a 2-second buffer before game start to account for clock skew and timing issues
    // This prevents valid answers from being filtered out due to minor timing differences
    const gameStartBuffer = gameStartedAt ? new Date(gameStartedAt.getTime() - 2000) : null
    
    const validAnswerRecords = (questionAnswers || []).filter((a: any) => {
      if (!hasRecordedAnswer(a)) {
        return false
      }
      if (gameStartBuffer) {
        const answeredAt = new Date(a.answered_at)
        return answeredAt >= gameStartBuffer
      }
      return true
    })

    const answeredParticipantIds = new Set(
      validAnswerRecords.map((a: any) => a.participant_id)
    )

    const ignoredPlaceholders = (questionAnswers?.length || 0) - validAnswerRecords.length
    
    console.log('[answer-status] DEBUG: Filtering answers by game start time:', {
      gameStartedAt: gameStartedAt?.toISOString(),
      gameStartBuffer: gameStartBuffer?.toISOString(),
      totalAnswers: questionAnswers?.length || 0,
      filteredAnswers: validAnswerRecords.length,
      ignoredPlaceholders,
      answerTimestamps: questionAnswers?.map((a: any) => ({
        participantId: a.participant_id,
        answeredAt: a.answered_at,
        isAfterStart: gameStartBuffer ? (a.answered_at ? new Date(a.answered_at) >= gameStartBuffer : false) : true,
        hasRecordedAnswer: hasRecordedAnswer(a)
      }))
    })

    console.log('[answer-status] DEBUG: Answered participant IDs:', {
      answeredParticipantIds: Array.from(answeredParticipantIds),
      answeredCount: answeredParticipantIds.size,
      totalParticipantIds: participants.map((p: any) => p.id)
    })

    // Check if current user has answered
    const { data: userParticipant } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id)
      .single()

    const userAnswered = userParticipant
      ? answeredParticipantIds.has(userParticipant.id)
      : false

    const allAnswered = participants.every((p: any) =>
      answeredParticipantIds.has(p.id)
    )

    // Detailed logging for debugging
    const participantStatus = participants.map((p: any) => ({
      participantId: p.id,
      userId: p.user_id,
      hasAnswered: answeredParticipantIds.has(p.id),
      isCurrentUser: userParticipant?.id === p.id
    }))

    console.log('[answer-status] DEBUG: Final status check:', {
      questionOrder,
      allAnswered,
      userAnswered,
      answeredCount: answeredParticipantIds.size,
      totalCount: participants.length,
      participantStatus,
      allParticipantsHaveAnswered: participantStatus.every((p: any) => p.hasAnswered),
      clientMeta
    })

    const shouldLogDetailed =
      answeredParticipantIds.size === participants.length ||
      searchParams.has('verify') ||
      searchParams.has('verify2') ||
      (clientMeta?.consecutiveChecks ?? 0) >= 2

    if (shouldLogDetailed) {
      await logInfo(
        'quiz.answer-status snapshot',
        {
          code,
          challengeId: challenge.id,
          questionOrder,
          allAnswered,
          userAnswered,
          answeredCount: answeredParticipantIds.size,
          totalCount: participants.length,
          participantStatus,
          answeredParticipantIds: Array.from(answeredParticipantIds),
          clientMeta,
          searchParams: {
            verify: searchParams.get('verify') === 'true' || searchParams.has('verify'),
            verify2: searchParams.get('verify2') === 'true' || searchParams.has('verify2')
          }
        },
        '/api/quiz/challenges/[code]/answer-status',
        user.id,
        session.user.email
      )
    }

    const response = NextResponse.json({
      allAnswered,
      answeredCount: answeredParticipantIds.size,
      totalCount: participants.length,
      userAnswered,
    })
    
    // Explicitly disable all caching for production
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
  } catch (error) {
    console.error('Error in GET /api/quiz/challenges/[code]/answer-status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



