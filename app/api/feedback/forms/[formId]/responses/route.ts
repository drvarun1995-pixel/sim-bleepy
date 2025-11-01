import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

type Summary = {
  totalResponses: number
  averageRating: number | null
  ratingDistribution: Record<string, number>
  questionSummaries: Record<string, {
    question: string
    type: string
    averageRating?: number | null
    responses: Array<string | number>
  }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'meded_team', 'ctf'].includes(userRecord.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { data: feedbackForm, error: formError } = await supabaseAdmin
      .from('feedback_forms')
      .select('id, form_name, form_template, questions, anonymous_enabled, event_id, created_at')
      .eq('id', formId)
      .single()

    if (formError || !feedbackForm) {
      return NextResponse.json({ error: 'Feedback form not found' }, { status: 404 })
    }

    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('feedback_responses')
      .select(`
        id,
        responses,
        completed_at,
        created_at,
        user_id,
        booking_id,
        users ( id, name, email ),
        events ( id, title, date, start_time, end_time )
      `)
      .eq('feedback_form_id', formId)
      .order('completed_at', { ascending: false })

    if (responsesError) {
      console.error('Error fetching feedback responses:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch feedback responses' }, { status: 500 })
    }

    const anonymousEnabled = Boolean((feedbackForm as any).anonymous_enabled)
    const questions = (feedbackForm.questions || []) as Array<{
      id: string
      question: string
      type: string
      required?: boolean
      scale?: number
    }>

    const ratingDistribution: Record<string, number> = {}
    const questionSummaries: Summary['questionSummaries'] = {}
    let totalRating = 0
    let ratingCount = 0

    questions.forEach((question) => {
      questionSummaries[question.id] = {
        question: question.question,
        type: question.type,
        responses: []
      }
    })

    const formattedResponses = (responses || []).map((response) => {
      const formQuestions = Array.isArray(questions) ? questions : []
      const processedResponses: Record<string, string | number> = {}

      formQuestions.forEach((question) => {
        const value = response.responses?.[question.id]
        if (value !== undefined && value !== null) {
          processedResponses[question.id] = value

          const summary = questionSummaries[question.id]
          if (summary) {
            summary.responses.push(value)
            if (question.type === 'rating') {
              const numericValue = Number(value)
              if (!Number.isNaN(numericValue)) {
                totalRating += numericValue
                ratingCount += 1
                const key = numericValue.toString()
                ratingDistribution[key] = (ratingDistribution[key] || 0) + 1
              }
            }
          }
        }
      })

      return {
        id: response.id,
        completedAt: response.completed_at,
        createdAt: response.created_at,
        user: anonymousEnabled
          ? {
              id: null,
              name: 'Anonymous',
              email: null
            }
          : {
              id: response.users?.[0]?.id || response.user_id,
              name: response.users?.[0]?.name || 'Unknown',
              email: response.users?.[0]?.email || null
            },
        responses: processedResponses,
        event: response.events?.[0]
          ? {
              id: response.events[0].id,
              title: response.events[0].title,
              date: response.events[0].date,
              startTime: response.events[0].start_time,
              endTime: response.events[0].end_time
            }
          : null
      }
    })

    Object.values(questionSummaries).forEach((summary) => {
      if (summary.type === 'rating' && summary.responses.length > 0) {
        const numericResponses = summary.responses
          .map((value) => Number(value))
          .filter((value) => !Number.isNaN(value))
        if (numericResponses.length > 0) {
          const total = numericResponses.reduce((acc, value) => acc + value, 0)
          summary.averageRating = Number((total / numericResponses.length).toFixed(2))
        } else {
          summary.averageRating = null
        }
      }
    })

    const summary: Summary = {
      totalResponses: formattedResponses.length,
      averageRating:
        ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : null,
      ratingDistribution,
      questionSummaries
    }

    return NextResponse.json({
      success: true,
      form: {
        id: feedbackForm.id,
        formName: feedbackForm.form_name,
        formTemplate: feedbackForm.form_template,
        questions,
        anonymousEnabled,
        eventId: feedbackForm.event_id,
        createdAt: feedbackForm.created_at
      },
      responses: formattedResponses,
      summary
    })
  } catch (error) {
    console.error('Error in feedback form responses API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

