import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Getting feedback templates')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query based on user role
    let query = supabaseAdmin
      .from('feedback_templates')
      .select(`
        id, name, description, category, questions, is_system_template, 
        is_active, usage_count, created_at, updated_at, is_shared, shared_at,
        users!feedback_templates_created_by_fkey (
          id, name, role
        )
      `)
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add role-based filtering
    if (user.role === 'admin') {
      // Admins can see all templates - no additional filtering needed
    } else if (['meded_team', 'ctf', 'educator'].includes(user.role)) {
      // Staff can see their own templates + shared templates
      query = query.or(`created_by.eq.${user.id},is_shared.eq.true`)
    } else {
      // Other roles can only see shared templates
      query = query.eq('is_shared', true)
    }

    // Add filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: templates, error: templatesError } = await query

    if (templatesError) {
      console.error('Error fetching feedback templates:', templatesError)
      return NextResponse.json({ 
        error: 'Failed to fetch feedback templates' 
      }, { status: 500 })
    }

    // Transform data to include question count
    const transformedTemplates = templates?.map(template => ({
      ...template,
      question_count: Array.isArray(template.questions) ? template.questions.length : 0
    })) || []

    return NextResponse.json({
      success: true,
      templates: transformedTemplates
    })

  } catch (error) {
    console.error('Error in GET /api/feedback/templates:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating feedback template')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.role
    if (!['admin', 'meded_team', 'ctf'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    console.log('📝 Received template request:', JSON.stringify(body, null, 2))
    
    const { 
      name, 
      description, 
      category = 'custom',
      questions = [],
      is_active = true
    } = body

    if (!name || !Array.isArray(questions)) {
      console.error('❌ Missing required fields:', { name, questions })
      return NextResponse.json({ 
        error: 'Missing required fields: name, questions' 
      }, { status: 400 })
    }

    // Validate questions structure
    const validQuestionTypes = ['rating', 'text', 'long_text', 'yes_no', 'multiple_choice']
    for (const question of questions) {
      if (!question.type || !validQuestionTypes.includes(question.type)) {
        return NextResponse.json({ 
          error: `Invalid question type: ${question.type}. Must be one of: ${validQuestionTypes.join(', ')}` 
        }, { status: 400 })
      }
      if (!question.question) {
        return NextResponse.json({ 
          error: 'All questions must have a question text' 
        }, { status: 400 })
      }
    }

    // Check if template name already exists for this user
    const { data: existingTemplate } = await supabaseAdmin
      .from('feedback_templates')
      .select('id')
      .eq('name', name)
      .eq('created_by', user.id)
      .single()

    if (existingTemplate) {
      return NextResponse.json({ 
        error: 'A template with this name already exists' 
      }, { status: 400 })
    }

    // Create template
    const { data: newTemplate, error: createError } = await supabaseAdmin
      .from('feedback_templates')
      .insert({
        name,
        description: description || null,
        category,
        questions,
        is_active,
        created_by: user.id
      })
      .select(`
        id, name, description, category, questions, is_system_template, 
        is_active, usage_count, created_at, updated_at,
        users!feedback_templates_created_by_fkey (
          id, name, role
        )
      `)
      .single()

    if (createError) {
      console.error('❌ Failed to create template:', createError)
      return NextResponse.json({ 
        error: 'Failed to create template',
        details: createError.message
      }, { status: 500 })
    }

    console.log('✅ Template created successfully:', newTemplate.id)

    return NextResponse.json({
      success: true,
      template: {
        ...newTemplate,
        question_count: Array.isArray(newTemplate.questions) ? newTemplate.questions.length : 0
      }
    })

  } catch (error) {
    console.error('Error in POST /api/feedback/templates:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
