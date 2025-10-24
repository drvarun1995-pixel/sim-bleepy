import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Getting feedback form templates')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.role
    if (!['admin', 'meded_team', 'ctf'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all feedback forms
    const { data: forms, error: formsError } = await supabaseAdmin
      .from('feedback_forms')
      .select(`
        id, form_name, form_template, questions, active, created_at,
        events (
          id, title, date
        ),
        users (
          id, name
        )
      `)
      .order('created_at', { ascending: false })

    if (formsError) {
      console.error('Error fetching feedback forms:', formsError)
      return NextResponse.json({ 
        error: 'Failed to fetch feedback forms' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      forms: forms || []
    })

  } catch (error) {
    console.error('Error in GET /api/feedback/forms:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating feedback form')
    
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
    const { 
      eventId, 
      formName, 
      formTemplate, 
      customQuestions 
    } = body

    if (!eventId || !formName || !formTemplate) {
      return NextResponse.json({ 
        error: 'Missing required fields: eventId, formName, formTemplate' 
      }, { status: 400 })
    }

    // Validate form template
    const validTemplates = ['workshop', 'seminar', 'clinical_skills', 'custom']
    if (!validTemplates.includes(formTemplate)) {
      return NextResponse.json({ 
        error: 'Invalid form template' 
      }, { status: 400 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title, date')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 })
    }

    // Generate questions based on template
    let questions = []
    
    if (formTemplate === 'workshop') {
      questions = [
        {
          id: 'q1',
          type: 'rating',
          question: 'How would you rate this workshop overall?',
          required: true,
          scale: 5
        },
        {
          id: 'q2',
          type: 'rating',
          question: 'How relevant was the content to your learning needs?',
          required: true,
          scale: 5
        },
        {
          id: 'q3',
          type: 'text',
          question: 'What was the most valuable thing you learned?',
          required: false
        },
        {
          id: 'q4',
          type: 'text',
          question: 'How could this workshop be improved?',
          required: false
        },
        {
          id: 'q5',
          type: 'yes_no',
          question: 'Would you recommend this workshop to others?',
          required: true
        }
      ]
    } else if (formTemplate === 'seminar') {
      questions = [
        {
          id: 'q1',
          type: 'rating',
          question: 'How would you rate this seminar?',
          required: true,
          scale: 5
        },
        {
          id: 'q2',
          type: 'rating',
          question: 'How clear was the presentation?',
          required: true,
          scale: 5
        },
        {
          id: 'q3',
          type: 'text',
          question: 'What key insights did you gain?',
          required: false
        },
        {
          id: 'q4',
          type: 'text',
          question: 'Any suggestions for future seminars?',
          required: false
        }
      ]
    } else if (formTemplate === 'clinical_skills') {
      questions = [
        {
          id: 'q1',
          type: 'rating',
          question: 'How would you rate this clinical skills session?',
          required: true,
          scale: 5
        },
        {
          id: 'q2',
          type: 'rating',
          question: 'How confident do you feel with these skills now?',
          required: true,
          scale: 5
        },
        {
          id: 'q3',
          type: 'text',
          question: 'What skills would you like more practice with?',
          required: false
        },
        {
          id: 'q4',
          type: 'text',
          question: 'How could the practical elements be improved?',
          required: false
        }
      ]
    } else if (formTemplate === 'custom' && customQuestions) {
      questions = customQuestions
    }

    // Create feedback form
    const { data: feedbackForm, error: createError } = await supabaseAdmin
      .from('feedback_forms')
      .insert({
        event_id: eventId,
        form_name: formName,
        form_template: formTemplate,
        questions: questions,
        created_by: user.id,
        active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating feedback form:', createError)
      return NextResponse.json({ 
        error: 'Failed to create feedback form' 
      }, { status: 500 })
    }

    console.log('✅ Feedback form created successfully:', feedbackForm.id)

    return NextResponse.json({
      success: true,
      feedbackForm: {
        id: feedbackForm.id,
        eventId: eventId,
        formName: formName,
        formTemplate: formTemplate,
        questions: questions,
        active: true
      }
    })

  } catch (error) {
    console.error('Error in POST /api/feedback/forms:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}


