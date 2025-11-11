import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - Get single question
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (for draft/archived questions)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    const isAdmin = user?.role === 'admin'

    const { data: question, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching question:', error)
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Non-admins can only see published questions
    if (!isAdmin && question.status !== 'published') {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error in GET /api/quiz/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update question (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      scenario_text,
      scenario_image_url,
      scenario_table_data,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      correct_answer,
      explanation_text,
      explanation_image_url,
      explanation_table_data,
      category,
      difficulty,
      tags,
      status,
    } = body

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (scenario_text !== undefined) updateData.scenario_text = scenario_text
    if (scenario_image_url !== undefined) updateData.scenario_image_url = scenario_image_url
    if (scenario_table_data !== undefined) updateData.scenario_table_data = scenario_table_data
    if (question_text !== undefined) updateData.question_text = question_text
    if (option_a !== undefined) updateData.option_a = option_a
    if (option_b !== undefined) updateData.option_b = option_b
    if (option_c !== undefined) updateData.option_c = option_c
    if (option_d !== undefined) updateData.option_d = option_d
    if (option_e !== undefined) updateData.option_e = option_e
    if (correct_answer !== undefined) {
      if (!['A', 'B', 'C', 'D', 'E'].includes(correct_answer)) {
        return NextResponse.json({ error: 'Invalid correct_answer' }, { status: 400 })
      }
      updateData.correct_answer = correct_answer
    }
    if (explanation_text !== undefined) updateData.explanation_text = explanation_text
    if (explanation_image_url !== undefined) updateData.explanation_image_url = explanation_image_url
    if (explanation_table_data !== undefined) updateData.explanation_table_data = explanation_table_data
    if (category !== undefined) updateData.category = category
    if (difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
      }
      updateData.difficulty = difficulty
    }
    if (tags !== undefined) updateData.tags = tags
    if (status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status
    }

    const { data: question, error } = await supabaseAdmin
      .from('quiz_questions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating question:', error)
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    }

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error in PUT /api/quiz/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete question (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('quiz_questions')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting question:', error)
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/quiz/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

