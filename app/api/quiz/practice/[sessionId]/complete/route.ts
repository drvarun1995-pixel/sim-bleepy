import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// POST - Complete practice session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
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

    // Get all answers for summary
    // Try to order by question_order first, fallback to answered_at
    let answers
    let answersError
    try {
      const { data: answersWithOrder, error: orderError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .select('*')
        .eq('session_id', sessionId)
        .order('question_order', { ascending: true })
      
      if (orderError && orderError.message?.includes('question_order')) {
        // Column doesn't exist, try without it
        const { data: answersWithoutOrder, error: noOrderError } = await supabaseAdmin
          .from('quiz_practice_answers')
          .select('*')
          .eq('session_id', sessionId)
          .order('answered_at', { ascending: true })
        
        answers = answersWithoutOrder || []
        answersError = noOrderError
      } else {
        answers = answersWithOrder || []
        answersError = orderError
      }
    } catch (error: any) {
      // Fallback to basic query without ordering
      const { data: basicAnswers, error: basicError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .select('*')
        .eq('session_id', sessionId)
      
      answers = basicAnswers || []
      answersError = basicError
    }

    if (answersError) {
      console.error('Error fetching answers:', answersError)
    }

    let finalSession = practiceSession

    // Only update if not already completed
    if (!practiceSession.completed) {
      const { data: updatedSession, error: updateError } = await supabaseAdmin
        .from('quiz_practice_sessions')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (updateError) {
        console.error('Error completing session:', updateError)
        // Don't fail if update fails, just use existing session data
      } else if (updatedSession) {
        finalSession = updatedSession
      }
    }

    // Calculate breakdown of answers
    const answersList = answers || []
    let correctCount = 0
    let incorrectCount = 0
    let unansweredCount = 0
    
    answersList.forEach((answer: any) => {
      // Check if question was unanswered (selected_answer is null or empty string)
      if (answer.selected_answer === null || answer.selected_answer === '' || answer.selected_answer === undefined) {
        // Unanswered (timeout)
        unansweredCount++
      } else if (answer.is_correct === true) {
        // Answered correctly
        correctCount++
      } else if (answer.is_correct === false) {
        // Answered but incorrect
        incorrectCount++
      }
    })
    
    // Use calculated counts from answers (preferred), or fall back to session data if no answers
    const hasAnswerData = answersList.length > 0
    const finalCorrectCount = hasAnswerData ? correctCount : (finalSession.correct_count || 0)
    const finalIncorrectCount = hasAnswerData ? incorrectCount : Math.max(0, (finalSession.question_count || 0) - (finalSession.correct_count || 0))
    const finalUnansweredCount = hasAnswerData ? unansweredCount : 0
    
    // Calculate accuracy (only based on answered questions, excluding unanswered)
    const answeredCount = finalCorrectCount + finalIncorrectCount
    const accuracy = answeredCount > 0
      ? (finalCorrectCount / answeredCount) * 100
      : 0

    // Fetch questions for display (for both continuous and paced modes)
    let questionsWithAnswers: any[] = []
    if (answersList.length > 0) {
      const questionIds = answersList.map((a: any) => a.question_id).filter((id: any) => id !== null && id !== undefined)
      
      if (questionIds.length > 0) {
        const { data: questions, error: questionsError } = await supabaseAdmin
          .from('quiz_questions')
          .select('*')
          .in('id', questionIds)

        if (!questionsError && questions && questions.length > 0) {
          // Create a map of question_id to question
          const questionMap = new Map(questions.map((q: any) => [q.id, q]))
          
          // Match answers with questions in the order they were answered
          questionsWithAnswers = answersList
            .map((answer: any) => {
              const question = questionMap.get(answer.question_id)
              if (question) {
                return {
                  question: question,
                  answer: answer,
                  selectedAnswer: answer.selected_answer,
                  correctAnswer: question.correct_answer,
                  isCorrect: answer.is_correct === true,
                  isUnanswered: answer.selected_answer === null || answer.selected_answer === '' || answer.selected_answer === undefined,
                }
              }
              return null
            })
            .filter((item: any) => item !== null)
        }
      }
    }

    return NextResponse.json({
      session: finalSession,
      answers: answersList,
      questionsWithAnswers: questionsWithAnswers, // Populated for both continuous and paced modes
      summary: {
        totalQuestions: finalSession.question_count,
        correctAnswers: finalCorrectCount,
        incorrectAnswers: finalIncorrectCount,
        unansweredCount: finalUnansweredCount,
        accuracy: Math.round(accuracy * 100) / 100,
        totalScore: finalSession.score || 0,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/practice/[sessionId]/complete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


