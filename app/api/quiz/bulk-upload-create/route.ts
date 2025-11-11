import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { questions } = body

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 })
    }

    // Validate and prepare questions
    const questionsToInsert = questions
      .filter((q: any) => q.isValid !== false)
      .map((q: any) => ({
        scenario_text: q.scenario_text || '',
        scenario_image_url: q.scenario_image_url || null,
        scenario_table_data: q.scenario_table_data || null,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        option_e: q.option_e,
        correct_answer: q.correct_answer,
        explanation_text: q.explanation_text,
        explanation_image_url: q.explanation_image_url || null,
        explanation_table_data: q.explanation_table_data || null,
        category: q.category,
        difficulty: q.difficulty,
        tags: q.tags || [],
        created_by: user.id,
        status: q.status || 'draft',
      }))

    if (questionsToInsert.length === 0) {
      return NextResponse.json({ error: 'No valid questions to create' }, { status: 400 })
    }

    // Insert questions
    const { data: createdQuestions, error } = await supabaseAdmin
      .from('quiz_questions')
      .insert(questionsToInsert)
      .select()

    if (error) {
      console.error('Error creating questions:', error)
      return NextResponse.json({ error: 'Failed to create questions' }, { status: 500 })
    }

    return NextResponse.json({
      created: createdQuestions?.length || 0,
      questions: createdQuestions
    })
  } catch (error: any) {
    console.error('Error in bulk upload create:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create questions' 
    }, { status: 500 })
  }
}

