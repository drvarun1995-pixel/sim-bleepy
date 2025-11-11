import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get practice session details with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params

    // Get user ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get practice session
    const { data: practiceSession, error: sessionError } = await supabaseAdmin
      .from('quiz_practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !practiceSession) {
      return NextResponse.json({ error: 'Practice session not found' }, { status: 404 })
    }

    // Get questions for this session from practice answers
    // Try to get question_order first, fallback to just question_id if column doesn't exist
    let answers
    let answersError
    
    // First, try with question_order
    const answersQuery = supabaseAdmin
      .from('quiz_practice_answers')
      .select('question_id, question_order')
      .eq('session_id', sessionId)
    
    const { data: answersWithOrder, error: orderError } = await answersQuery.order('question_order', { ascending: true })
    
    if (orderError) {
      // If question_order column doesn't exist, try without it
      console.warn('Error fetching with question_order, trying without:', orderError.message)
      const { data: answersWithoutOrder, error: noOrderError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .select('question_id')
        .eq('session_id', sessionId)
        .order('answered_at', { ascending: true })
      
      if (noOrderError) {
        console.error('Error fetching practice answers:', noOrderError)
        return NextResponse.json({ 
          error: 'Failed to fetch session questions',
          details: noOrderError.message 
        }, { status: 500 })
      }
      answers = answersWithoutOrder?.map((a, index) => ({ question_id: a.question_id, question_order: index + 1 })) || []
    } else {
      answers = answersWithOrder || []
    }

    // If no answers exist yet, this means the session was just created but questions haven't been stored
    // This shouldn't happen with the new flow, but we'll handle it gracefully
    if (!answers || answers.length === 0) {
      console.warn(`No practice answers found for session ${sessionId}. Session may have been created before question storage was implemented.`)
      return NextResponse.json({
        session: practiceSession,
        questions: [],
        message: 'No questions found for this session. Please start a new practice session.',
      })
    }

    // Fetch full question details
    const questionIds = answers.map(a => a.question_id)
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .in('id', questionIds)
      .eq('status', 'published')

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Sort questions by the order in answers
    const questionMap = new Map(questions.map(q => [q.id, q]))
    const sortedQuestions = answers
      .map(a => questionMap.get(a.question_id))
      .filter(q => q !== undefined)

    return NextResponse.json({
      session: practiceSession,
      questions: sortedQuestions,
    })
  } catch (error: any) {
    console.error('Error in GET /api/quiz/practice/[sessionId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

