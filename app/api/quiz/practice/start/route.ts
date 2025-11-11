import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// POST - Start practice session
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { category, difficulty, question_count = 10 } = body

    // Build query for questions
    let query = supabaseAdmin
      .from('quiz_questions')
      .select('id')
      .eq('status', 'published')

    if (category) {
      query = query.eq('category', category)
    }

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty)
    }

    // Get random questions
    const { data: allQuestions, error: questionsError } = await query

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 })
    }

    // Shuffle and select questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random())
    const selectedQuestions = shuffled.slice(0, Math.min(question_count, shuffled.length))

    // Create practice session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('quiz_practice_sessions')
      .insert({
        user_id: user.id,
        category: category || null,
        difficulty: difficulty && difficulty !== 'all' ? difficulty : null,
        question_count: selectedQuestions.length,
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating practice session:', sessionError)
      return NextResponse.json({ error: 'Failed to create practice session' }, { status: 500 })
    }

    // Store questions in practice_answers table with order
    // Try with question_order first, fallback to without if column doesn't exist
    const practiceAnswersWithOrder = selectedQuestions.map((q, index) => ({
      session_id: sessionData.id,
      question_id: q.id,
      question_order: index + 1,
    }))

    let answersError
    const { error: orderError } = await supabaseAdmin
      .from('quiz_practice_answers')
      .insert(practiceAnswersWithOrder)

    if (orderError) {
      // If question_order column doesn't exist, try without it
      console.warn('Error storing with question_order, trying without:', orderError.message)
      const practiceAnswersWithoutOrder = selectedQuestions.map((q) => ({
        session_id: sessionData.id,
        question_id: q.id,
      }))

      const { error: noOrderError } = await supabaseAdmin
        .from('quiz_practice_answers')
        .insert(practiceAnswersWithoutOrder)

      if (noOrderError) {
        console.error('Error storing practice answers (without order):', noOrderError)
        answersError = noOrderError
        // Still continue - the session is created, questions are returned
        // User will need to run migration to add question_order column
      }
    }

    return NextResponse.json({
      session: sessionData,
      questions: selectedQuestions,
    })
  } catch (error) {
    console.error('Error in POST /api/quiz/practice/start:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


