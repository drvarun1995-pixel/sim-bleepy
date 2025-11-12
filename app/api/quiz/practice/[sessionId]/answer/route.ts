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

    // Validate required fields
    // Note: selected_answer can be empty string for timeout, so we only check if it's undefined/null
    if (!question_id || selected_answer === undefined || selected_answer === null || time_taken_seconds === undefined) {
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

    // Check if answer is correct (empty string means timeout/no answer)
    const isCorrect = selected_answer !== '' && selected_answer === question.correct_answer

    // Get current streak (count consecutive correct answers in this session)
    // Only count answers that have been answered (have selected_answer)
    let previousAnswers: any[] = []
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
    // Use .maybeSingle() to handle case where row doesn't exist without throwing error
    let existingAnswerRow
    try {
      // Try to select with question_order first
      const { data, error: checkError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .select('id, question_order')
        .eq('session_id', sessionId)
        .eq('question_id', question_id)
        .maybeSingle()

      if (checkError) {
        // If error is about column not existing, try without question_order
        if (checkError.message?.includes('column') && checkError.message?.includes('question_order')) {
          console.warn('question_order column not found, trying without it:', checkError.message)
          const { data: dataWithoutOrder, error: checkError2 } = await supabaseAdmin
            .from('quiz_practice_answers')
            .select('id')
            .eq('session_id', sessionId)
            .eq('question_id', question_id)
            .maybeSingle()
          
          if (checkError2 && checkError2.code !== 'PGRST116') {
            console.error('Error checking for existing answer row (without order):', checkError2)
          } else if (dataWithoutOrder) {
            existingAnswerRow = dataWithoutOrder
          }
        } else if (checkError.code !== 'PGRST116') {
          // PGRST116 is "not found" which is expected, other errors are real issues
          console.error('Error checking for existing answer row:', checkError)
          // Don't throw, continue with insert path
        }
      } else if (data) {
        existingAnswerRow = data
      }
    } catch (error: any) {
      console.error('Exception checking for existing answer row:', error)
      // Continue with insert path if check fails
      existingAnswerRow = null
    }

    let finalAnswerData
    let previousPoints = 0
    let previousWasCorrect = false
    
    // Get previous answer data if updating
    if (existingAnswerRow && existingAnswerRow.id) {
      const { data: previousAnswer } = await supabaseAdmin
        .from('quiz_practice_answers')
        .select('points_earned, is_correct')
        .eq('id', existingAnswerRow.id)
        .single()
      
      if (previousAnswer) {
        previousPoints = previousAnswer.points_earned || 0
        previousWasCorrect = previousAnswer.is_correct || false
      }
    }
    
    // Store selected_answer as NULL if empty string (for timeout cases)
    const answerToStore = selected_answer === '' ? null : selected_answer
    
    if (existingAnswerRow && existingAnswerRow.id) {
      // Update existing row
      const updateData: any = {
        selected_answer: answerToStore,
        is_correct: isCorrect,
        time_taken_seconds,
        points_earned: scoringResult.totalPoints,
        answered_at: new Date().toISOString(),
      }
      
      const { data: answerData, error: answerError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .update(updateData)
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
      console.log(`Answer row not found for session ${sessionId}, question ${question_id}, inserting new row`)
      
      const insertData: any = {
        session_id: sessionId,
        question_id,
        selected_answer: answerToStore,
        is_correct: isCorrect,
        time_taken_seconds,
        points_earned: scoringResult.totalPoints,
      }
      
      // Try to determine question_order from other questions in the session
      // Only add question_order if the column exists (check by trying to query it)
      let questionOrderExists = false
      try {
        const { data: testQuery } = await supabaseAdmin
          .from('quiz_practice_answers')
          .select('question_order')
          .limit(1)
        
        // If query succeeds, column exists
        questionOrderExists = true
        
        if (questionOrderExists) {
          const { data: otherAnswers } = await supabaseAdmin
            .from('quiz_practice_answers')
            .select('question_order')
            .eq('session_id', sessionId)
            .not('question_order', 'is', null)
            .order('question_order', { ascending: false })
            .limit(1)
          
          if (otherAnswers && otherAnswers.length > 0 && otherAnswers[0].question_order !== null && otherAnswers[0].question_order !== undefined) {
            insertData.question_order = otherAnswers[0].question_order + 1
          } else {
            // Try to get count of existing answers as fallback
            const { count } = await supabaseAdmin
              .from('quiz_practice_answers')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', sessionId)
            
            insertData.question_order = (count || 0) + 1
          }
        }
      } catch (orderError: any) {
        // Column doesn't exist or query failed, don't include question_order
        console.warn('question_order column may not exist, skipping:', orderError?.message || orderError)
        questionOrderExists = false
      }

      console.log('Inserting answer data:', { ...insertData, selected_answer: answerToStore === null ? 'NULL' : answerToStore })

      const { data: insertedAnswer, error: insertError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting answer:', insertError)
        console.error('Insert data was:', insertData)
        return NextResponse.json({ 
          error: 'Failed to save answer',
          details: insertError.message,
          hint: insertError.hint || 'Check server logs for more details'
        }, { status: 500 })
      }
      finalAnswerData = insertedAnswer
      console.log('Successfully inserted answer:', finalAnswerData?.id)
    }

    // Update session score
    // Subtract previous points if this was an update, then add new points
    const previousScore = practiceSession.score || 0
    const currentScore = previousScore - previousPoints + scoringResult.totalPoints
    
    // Update correct count: subtract 1 if previous was correct, add 1 if new is correct
    const previousCorrectCount = practiceSession.correct_count || 0
    let currentCorrectCount = previousCorrectCount
    if (previousWasCorrect && !isCorrect) {
      // Was correct, now incorrect - subtract 1
      currentCorrectCount = previousCorrectCount - 1
    } else if (!previousWasCorrect && isCorrect) {
      // Was incorrect, now correct - add 1
      currentCorrectCount = previousCorrectCount + 1
    }
    // If both were correct or both were incorrect, count stays the same
    
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
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      sessionId,
      question_id: error?.question_id,
      selected_answer: error?.selected_answer,
      message: error?.message,
      code: error?.code,
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
      // Include more details in development
      ...(process.env.NODE_ENV === 'development' && {
        stack: error?.stack,
        code: error?.code,
      })
    }, { status: 500 })
  }
}
