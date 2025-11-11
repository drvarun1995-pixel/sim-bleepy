import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { calculateScore } from '@/lib/quiz/scoring'

export const dynamic = 'force-dynamic'

// POST - Submit answer
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
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
      .eq('code', params.code)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 })
    }

    // Get participant
    const { data: participant } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .select('*')
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this challenge' }, { status: 403 })
    }

    const body = await request.json()
    const { question_id, question_order, selected_answer, time_taken_seconds } = body

    if (!question_id || !question_order || !selected_answer || time_taken_seconds === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get question
    const { data: question } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('id', question_id)
      .single()

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if already answered
    const { data: existingAnswer } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('participant_id', participant.id)
      .eq('question_id', question_id)
      .single()

    if (existingAnswer) {
      return NextResponse.json({ error: 'Answer already submitted' }, { status: 400 })
    }

    const isCorrect = selected_answer === question.correct_answer

    // Get current streak for this participant
    const { data: previousAnswers } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .select('is_correct')
      .eq('challenge_id', challenge.id)
      .eq('participant_id', participant.id)
      .order('question_order', { ascending: false })

    let currentStreak = 0
    if (previousAnswers) {
      for (const answer of previousAnswers) {
        if (answer.is_correct) {
          currentStreak++
        } else {
          break
        }
      }
    }
    if (isCorrect) {
      currentStreak++
    }

    // Calculate score
    const scoringResult = calculateScore({
      isCorrect,
      timeTakenSeconds: time_taken_seconds,
      difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
      currentStreak: isCorrect ? currentStreak : 0,
    })

    // Save answer
    const { data: answerData, error: answerError } = await supabaseAdmin
      .from('quiz_challenge_answers')
      .insert({
        challenge_id: challenge.id,
        participant_id: participant.id,
        question_id,
        question_order,
        selected_answer,
        is_correct: isCorrect,
        time_taken_seconds,
        points_earned: scoringResult.totalPoints,
      })
      .select()
      .single()

    if (answerError) {
      console.error('Error saving answer:', answerError)
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
    }

    // Update participant score
    const { data: updatedParticipant } = await supabaseAdmin
      .from('quiz_challenge_participants')
      .update({
        final_score: participant.final_score + scoringResult.totalPoints,
        questions_answered: participant.questions_answered + 1,
        correct_answers: participant.correct_answers + (isCorrect ? 1 : 0),
      })
      .eq('id', participant.id)
      .select()
      .single()

    return NextResponse.json({
      answer: answerData,
      isCorrect,
      correctAnswer: question.correct_answer,
      scoring: scoringResult,
      participant: updatedParticipant,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/challenges/[code]/answer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


