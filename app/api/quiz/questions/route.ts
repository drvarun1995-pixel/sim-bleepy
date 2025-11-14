import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { randomUUID } from 'crypto'
import { finalizeQuestionAssetFolder } from '@/lib/quiz/questionCleanup'

export const dynamic = 'force-dynamic'

// GET - List questions (with filters)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('quiz_questions')
      .select('*', { count: 'exact' })

    // Admin can see all statuses, others only published
    if (!isAdmin) {
      query = query.eq('status', 'published')
    } else if (status) {
      query = query.eq('status', status)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    if (search) {
      query = query.or(`scenario_text.ilike.%${search}%,question_text.ilike.%${search}%`)
    }

    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: questions, error, count } = await query

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({
      questions: questions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/quiz/questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create question (admin only)
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
      status = 'draft',
      asset_folder_id,
    } = body

    // Validate required fields
    if (!scenario_text || !question_text || !option_a || !option_b || !option_c || !option_d || !option_e || !correct_answer || !explanation_text || !category || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['A', 'B', 'C', 'D', 'E'].includes(correct_answer)) {
      return NextResponse.json({ error: 'Invalid correct_answer' }, { status: 400 })
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
    }

    // Insert question
    const folderId =
      typeof asset_folder_id === 'string' && asset_folder_id.trim().length > 0
        ? asset_folder_id.trim()
        : randomUUID()

    const { data: question, error } = await supabaseAdmin
      .from('quiz_questions')
      .insert({
        scenario_text,
        scenario_image_url: scenario_image_url || null,
        scenario_table_data: scenario_table_data || null,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        option_e,
        correct_answer,
        explanation_text,
        explanation_image_url: explanation_image_url || null,
        explanation_table_data: explanation_table_data || null,
        category,
        difficulty,
        tags: tags || [],
        created_by: user.id,
        status,
        asset_folder_id: folderId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    let createdQuestion = question
    try {
      createdQuestion = await finalizeQuestionAssetFolder(question)
    } catch (finalizeError) {
      console.error('Failed to finalize question asset folder:', finalizeError)
    }

    return NextResponse.json({ question: createdQuestion }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quiz/questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

