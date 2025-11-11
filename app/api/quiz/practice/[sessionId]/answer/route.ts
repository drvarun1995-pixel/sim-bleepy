import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { calculateScore } from '@/lib/quiz/scoring'

export const dynamic = 'force-dynamic'

// POST - Submit answer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
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

    // Verify session belongs to user
    const { data: practiceSession, error: sessionError } = await supabaseAdmin
      .from('quiz_practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !practiceSession) {
      return NextResponse.json({ error: 'Practice session not found' }, { status: 404 })
    }

    if (practiceSession.completed) {
      return NextResponse.json({ error: 'Practice session already completed' }, { status: 400 })
    }

    const body = await request.json()
    const { question_id, selected_answer, time_taken_seconds } = body

    if (!question_id || !selected_answer || time_taken_seconds === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get question details
    const { data: question, error: questionError } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if answer is correct
    const isCorrect = selected_answer === question.correct_answer

    // Get current streak (count consecutive correct answers in this session)
    // Only count answers that have been answered (have selected_answer)
    let previousAnswers
    try {
      // Try with question_order first
      const { data: answersWithOrder, error: orderError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .select('is_correct, question_order')
        .eq('session_id', sessionId)
        .not('selected_answer', 'is', null)
        .order('question_order', { ascending: false })

      if (orderError) {
        // Fallback to answered_at if question_order doesn't exist
        const { data: answersWithoutOrder, error: noOrderError } = await supabaseAdmin
          .from('quiz_practice_answers')
          .select('is_correct')
          .eq('session_id', sessionId)
          .not('selected_answer', 'is', null)
          .order('answered_at', { ascending: false })

        if (noOrderError) {
          console.warn('Error fetching previous answers for streak calculation:', noOrderError)
          previousAnswers = []
        } else {
          previousAnswers = answersWithoutOrder || []
        }
      } else {
        previousAnswers = answersWithOrder || []
      }
    } catch (error) {
      console.warn('Error fetching previous answers:', error)
      previousAnswers = []
    }

    let currentStreak = 0
    if (previousAnswers && previousAnswers.length > 0) {
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

    // Check if answer row exists (questions should be pre-populated when session is created)
    const { data: existingAnswerRow } = await supabaseAdmin
      .from('quiz_practice_answers')
      .select('id, question_order')
      .eq('session_id', sessionId)
      .eq('question_id', question_id)
      .single()

    let finalAnswerData
    if (existingAnswerRow) {
      // Update existing row
      const { data: answerData, error: answerError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .update({
          selected_answer: selected_answer,
          is_correct: isCorrect,
          time_taken_seconds,
          points_earned: scoringResult.totalPoints,
          answered_at: new Date().toISOString(),
        })
        .eq('id', existingAnswerRow.id)
        .select()
        .single()

      if (answerError) {
        console.error('Error updating answer:', answerError)
        return NextResponse.json({ 
          error: 'Failed to save answer',
          details: answerError.message 
        }, { status: 500 })
      }
      finalAnswerData = answerData
    } else {
      // Row doesn't exist - insert new one (fallback for sessions created before question storage was implemented)
      const insertData: any = {
        session_id: sessionId,
        question_id,
        selected_answer: selected_answer,
        is_correct: isCorrect,
        time_taken_seconds,
        points_earned: scoringResult.totalPoints,
      }
      
      // Try to determine question_order from other questions in the session
      const { data: otherAnswers } = await supabaseAdmin
        .from('quiz_practice_answers')
        .select('question_order')
        .eq('session_id', sessionId)
        .not('question_order', 'is', null)
        .order('question_order', { ascending: false })
        .limit(1)
      
      if (otherAnswers && otherAnswers.length > 0) {
        insertData.question_order = (otherAnswers[0].question_order || 0) + 1
      } else {
        // No other questions, this is the first one
        insertData.question_order = 1
      }

      const { data: insertedAnswer, error: insertError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting answer:', insertError)
        return NextResponse.json({ 
          error: 'Failed to save answer',
          details: insertError.message 
        }, { status: 500 })
      }
      finalAnswerData = insertedAnswer
    }

    // Update session score
    const currentScore = (practiceSession.score || 0) + scoringResult.totalPoints
    const currentCorrectCount = (practiceSession.correct_count || 0) + (isCorrect ? 1 : 0)
    
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('quiz_practice_sessions')
      .update({
        score: currentScore,
        correct_count: currentCorrectCount,
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating session score:', updateError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      answer: finalAnswerData,
      isCorrect,
      correctAnswer: question.correct_answer,
      explanation: {
        text: question.explanation_text,
        image_url: question.explanation_image_url,
        table_data: question.explanation_table_data,
      },
      scoring: scoringResult,
      session: updatedSession || practiceSession,
    })
  } catch (error: any) {
    console.error('Error in POST /api/quiz/practice/[sessionId]/answer:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
