import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use the same client creation pattern as events/date API
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Getting feedback form templates')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabase
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
    const { data: forms, error: formsError } = await supabase
      .from('feedback_forms')
      .select(`
        id, form_name, form_template, questions, active, anonymous_enabled, created_at,
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
    const { data: user, error: userError } = await supabase
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
    console.log('📝 Received feedback form request:', JSON.stringify(body, null, 2))
    
    const { 
      eventId, 
      event_ids,
      form_name, 
      form_template, 
      anonymous_enabled,
      customQuestions,
      questions: questionsField  // Rename to avoid conflict
    } = body
    
    // Use customQuestions if available, otherwise fall back to questions
    const finalCustomQuestions = customQuestions || questionsField

    console.log('📝 Parsed fields:', {
      eventId,
      event_ids,
      form_name,
      form_template,
      anonymous_enabled,
      customQuestions: customQuestions?.length || 0,
      questions: questionsField?.length || 0,
      finalCustomQuestions: finalCustomQuestions?.length || 0
    })

    if (!form_name || !form_template) {
      console.error('❌ Missing required fields:', { form_name, form_template })
      return NextResponse.json({ 
        error: 'Missing required fields: form_name, form_template' 
      }, { status: 400 })
    }

    // Validate that at least one question is provided for custom forms
    if (form_template === 'custom' && (!finalCustomQuestions || finalCustomQuestions.length === 0)) {
      console.error('❌ No questions provided for custom form')
      return NextResponse.json({ 
        error: 'At least one question is required for custom feedback forms' 
      }, { status: 400 })
    }

    // Support both single eventId and multiple event_ids
    const eventIds = event_ids || (eventId ? [eventId] : [])
    
    console.log('📝 Event validation:', {
      eventId,
      event_ids,
      eventIds,
      eventIdsLength: eventIds.length
    })
    
    if (eventIds.length === 0) {
      console.error('❌ No events selected')
      return NextResponse.json({ 
        error: 'At least one event must be selected' 
      }, { status: 400 })
    }

    // Validate form template
    const validTemplates = ['workshop', 'seminar', 'clinical_skills', 'custom']
    if (!validTemplates.includes(form_template)) {
      return NextResponse.json({ 
        error: 'Invalid form template' 
      }, { status: 400 })
    }

    // Get event details for all selected events
    console.log('🔍 Looking up events with IDs:', eventIds)
    console.log('🔍 Supabase URL set:', !!supabaseUrl)
    console.log('🔍 Supabase Key set:', !!supabaseKey)
    
    // First, let's see what the event looks like without any filters
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
    
    console.log('🔍 All events (no filters):', allEvents)
    console.log('❌ All events error:', allEventsError)
    
    if (allEvents && allEvents.length > 0) {
      const event = allEvents[0]
      console.log('🔍 Event details:', {
        id: event.id,
        title: event.title,
        booking_enabled: event.booking_enabled,
        status: event.status,
        date: event.date
      })
    } else {
      console.log('❌ No events found without filters - this is the problem!')
    }
    
    // Since events were already filtered by events/date API, we need to verify they still exist
    // and meet the criteria. Let's query them with the same filters as events/date API
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, date')
      .in('id', eventIds)
      .eq('booking_enabled', true)
      .eq('status', 'published')

    console.log('📅 Events found (with filters):', events)
    console.log('❌ Events error:', eventsError)

    if (eventsError) {
      console.error('Database error fetching events:', eventsError)
      return NextResponse.json({ 
        error: 'Database error fetching events',
        details: eventsError.message 
      }, { status: 500 })
    }

    if (!events || events.length === 0) {
      console.error('No events found for IDs:', eventIds)
      return NextResponse.json({ 
        error: 'One or more events not found',
        requestedIds: eventIds,
        foundEvents: events || []
      }, { status: 404 })
    }

    if (events.length !== eventIds.length) {
      console.warn('Some events not found. Requested:', eventIds.length, 'Found:', events.length)
      const foundIds = events.map(e => e.id)
      const missingIds = eventIds.filter((id: any) => !foundIds.includes(id))
      console.warn('Missing event IDs:', missingIds)
    }

    // Generate questions based on template
    let questions = []
    
    if (form_template === 'workshop') {
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
    } else if (form_template === 'seminar') {
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
    } else if (form_template === 'clinical_skills') {
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
    } else if (form_template === 'custom' && customQuestions) {
      questions = customQuestions
    }

    // Create feedback forms for each event
    const createdForms = []
    
    for (const event of events) {
      const { data: feedbackForm, error: createError } = await supabase
        .from('feedback_forms')
        .insert({
          event_id: event.id,
          form_name: form_name,
          form_template: form_template,
          questions: finalCustomQuestions,
          created_by: user.id,
          active: true,
          ...(anonymous_enabled !== undefined && { anonymous_enabled: anonymous_enabled })
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating feedback form for event:', event.id, createError)
        return NextResponse.json({ 
          error: `Failed to create feedback form for event: ${event.title}` 
        }, { status: 500 })
      }

      createdForms.push({
        id: feedbackForm.id,
        eventId: event.id,
        eventTitle: event.title,
        formName: form_name,
        formTemplate: form_template,
        questions: questions,
        active: true,
        anonymousEnabled: anonymous_enabled || false
      })
    }

    console.log('✅ Feedback forms created successfully:', createdForms.length)

    return NextResponse.json({
      success: true,
      feedbackForms: createdForms,
      message: `Created ${createdForms.length} feedback form${createdForms.length > 1 ? 's' : ''}`
    })

  } catch (error) {
    console.error('Error in POST /api/feedback/forms:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}


