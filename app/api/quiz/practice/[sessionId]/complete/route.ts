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

    if (practiceSession.completed) {
      return NextResponse.json({ error: 'Practice session already completed' }, { status: 400 })
    }

    // Get all answers for summary
    const { data: answers, error: answersError } = await supabaseAdmin
      .from('quiz_practice_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('answered_at', { ascending: true })

    if (answersError) {
      console.error('Error fetching answers:', answersError)
    }

    // Update session as completed
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
      return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
    }

    // Calculate accuracy
    const accuracy = practiceSession.question_count > 0
      ? (practiceSession.correct_count / practiceSession.question_count) * 100
      : 0

    return NextResponse.json({
      session: updatedSession,
      answers: answers || [],
      summary: {
        totalQuestions: practiceSession.question_count,
        correctAnswers: practiceSession.correct_count,
        incorrectAnswers: practiceSession.question_count - practiceSession.correct_count,
        accuracy: Math.round(accuracy * 100) / 100,
        totalScore: practiceSession.score,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/practice/[sessionId]/complete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


