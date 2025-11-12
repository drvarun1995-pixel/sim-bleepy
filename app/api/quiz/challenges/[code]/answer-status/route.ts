import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get answer status for current question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { searchParams } = new URL(request.url)
    const questionOrder = parseInt(searchParams.get('question_order') || '1', 10)

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
    const { data: questionAnswers } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select('participant_id, selected_answer')
      .eq('challenge_id', challenge.id)
      .eq('question_id', questionId)
      .eq('question_order', questionOrder)

    // Only count answers where selected_answer is not null
    const answeredParticipantIds = new Set(
      (questionAnswers || [])
        .filter((a: any) => a.selected_answer !== null)
        .map((a: any) => a.participant_id)
    )

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

    return NextResponse.json({
      allAnswered,
      answeredCount: answeredParticipantIds.size,
      totalCount: participants.length,
      userAnswered,
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/challenges/[code]/answer-status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

