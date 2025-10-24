import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Getting feedback responses')
    
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

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build query
    let query = supabaseAdmin
      .from('feedback_responses')
      .select(`
        id, responses, completed_at, created_at,
        users (
          id, name, email
        ),
        feedback_forms (
          id, form_name, form_template, questions
        ),
        events (
          id, title, date, start_time, end_time
        )
      `)
      .order('completed_at', { ascending: false })
      .limit(limit)

    // Add event filter if specified
    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: responses, error: responsesError } = await query

    if (responsesError) {
      console.error('Error fetching feedback responses:', responsesError)
      return NextResponse.json({ 
        error: 'Failed to fetch feedback responses' 
      }, { status: 500 })
    }

    // Format response data
    const formattedResponses = (responses || []).map(response => ({
      id: response.id,
      userId: response.users?.[0]?.id,
      userName: response.users?.[0]?.name,
      userEmail: response.users?.[0]?.email,
      responses: response.responses,
      completedAt: response.completed_at,
      feedbackForm: {
        id: response.feedback_forms?.[0]?.id,
        formName: response.feedback_forms?.[0]?.form_name,
        formTemplate: response.feedback_forms?.[0]?.form_template,
        questions: response.feedback_forms?.[0]?.questions || []
      },
      events: {
        id: response.events?.[0]?.id,
        title: response.events?.[0]?.title,
        date: response.events?.[0]?.date,
        startTime: response.events?.[0]?.start_time,
        endTime: response.events?.[0]?.end_time
      }
    }))

    console.log('✅ Feedback responses retrieved successfully:', formattedResponses.length)

    return NextResponse.json({
      success: true,
      responses: formattedResponses,
      total: formattedResponses.length
    })

  } catch (error) {
    console.error('Error in GET /api/feedback/responses:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}


