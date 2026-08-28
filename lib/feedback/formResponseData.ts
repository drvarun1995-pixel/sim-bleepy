import { supabaseAdmin } from '@/utils/supabase'
import { isExpectedBookingStatus } from '@/lib/attendance-shared'

export type FeedbackQuestion = {
  id: string
  question: string
  type: string
  required?: boolean
  scale?: number
  options?: string[]
}

export type QuestionSummary = {
  question: string
  type: string
  averageRating?: number | null
  responses: Array<string | number>
  optionCounts?: Record<string, number>
}

export type FeedbackSummary = {
  totalResponses: number
  averageRating: number | null
  ratingDistribution: Record<string, number>
  questionSummaries: Record<string, QuestionSummary>
}

export type LinkedEvent = {
  id: string
  title: string
  date: string | null
  startTime: string | null
  endTime: string | null
  locationName: string | null
}

export type FormResponseRow = {
  id: string
  completedAt: string
  createdAt: string
  user: {
    id: string | null
    name: string | null
    email: string | null
  }
  responses: Record<string, string | number>
  event: LinkedEvent | null
}

export type SessionCoverage = {
  booked: number
  attended: number
  responses: number
  attendanceRatePercent: number | null
  responseRatePercent: number | null
}

export type FormResponsePayload = {
  form: {
    id: string
    formName: string
    formTemplate: string
    questions: FeedbackQuestion[]
    anonymousEnabled: boolean
    eventId: string | null
    createdAt: string
  }
  responses: FormResponseRow[]
  summary: FeedbackSummary
  linkedEvent: LinkedEvent | null
  coverage: SessionCoverage
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

async function loadEvent(eventId: string): Promise<LinkedEvent | null> {
  const withLocation = await supabaseAdmin
    .from('events')
    .select('id, title, date, start_time, end_time, locations ( name )')
    .eq('id', eventId)
    .single()

  const eventRecord = withLocation.error
    ? (
        await supabaseAdmin
          .from('events')
          .select('id, title, date, start_time, end_time')
          .eq('id', eventId)
          .single()
      ).data
    : withLocation.data

  if (!eventRecord) return null

  const location = unwrapRelation((eventRecord as { locations?: { name?: string } | { name?: string }[] }).locations)

  return {
    id: eventRecord.id,
    title: eventRecord.title,
    date: eventRecord.date,
    startTime: eventRecord.start_time,
    endTime: eventRecord.end_time,
    locationName: location?.name || null
  }
}

async function loadCoverage(eventId: string | null, responseCount: number): Promise<SessionCoverage> {
  if (!eventId) {
    return {
      booked: 0,
      attended: 0,
      responses: responseCount,
      attendanceRatePercent: null,
      responseRatePercent: null
    }
  }

  const { data: bookings, error } = await supabaseAdmin
    .from('event_bookings')
    .select('status, checked_in, registration_source')
    .eq('event_id', eventId)
    .neq('status', 'cancelled')

  if (error) {
    console.warn('Failed to load booking coverage for feedback report:', error)
    return {
      booked: 0,
      attended: 0,
      responses: responseCount,
      attendanceRatePercent: null,
      responseRatePercent: null
    }
  }

  const rows = bookings || []
  const booked = rows.filter((row) => isExpectedBookingStatus(row.status)).length
  const attended = rows.filter((row) => {
    const status = String(row.status || '').toLowerCase()
    return status === 'attended' || Boolean(row.checked_in)
  }).length
  const denominator = attended > 0 ? attended : booked
  const attendanceRatePercent = booked > 0 ? Math.round((attended / booked) * 100) : null
  const responseRatePercent = denominator > 0 ? Math.round((responseCount / denominator) * 100) : null

  return {
    booked,
    attended,
    responses: responseCount,
    attendanceRatePercent,
    responseRatePercent
  }
}

export async function loadFeedbackFormResponses(formId: string): Promise<
  { ok: true; data: FormResponsePayload } | { ok: false; status: number; error: string }
> {
  const { data: feedbackForm, error: formError } = await supabaseAdmin
    .from('feedback_forms')
    .select('id, form_name, form_template, questions, anonymous_enabled, event_id, created_at')
    .eq('id', formId)
    .single()

  if (formError || !feedbackForm) {
    return { ok: false, status: 404, error: 'Feedback form not found' }
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
    return { ok: false, status: 500, error: 'Failed to fetch feedback responses' }
  }

  const anonymousEnabled = Boolean(feedbackForm.anonymous_enabled)
  const questions = (feedbackForm.questions || []) as FeedbackQuestion[]

  const ratingDistribution: Record<string, number> = {}
  const questionSummaries: FeedbackSummary['questionSummaries'] = {}
  let totalRating = 0
  let ratingCount = 0

  questions.forEach((question) => {
    let optionCounts: Record<string, number> | undefined

    if (question.type === 'multiple_choice') {
      if (Array.isArray(question.options) && question.options.length > 0) {
        optionCounts = question.options.reduce<Record<string, number>>((acc, option) => {
          acc[String(option)] = 0
          return acc
        }, {})
      } else {
        optionCounts = {}
      }
    }

    if (question.type === 'yes_no') {
      optionCounts = { Yes: 0, No: 0 }
    }

    questionSummaries[question.id] = {
      question: question.question,
      type: question.type,
      responses: [],
      optionCounts
    }
  })

  const formattedResponses = (responses || []).map((response) => {
    const processedResponses: Record<string, string | number> = {}

    questions.forEach((question) => {
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
          } else if (question.type === 'multiple_choice') {
            const optionCounts = summary.optionCounts || (summary.optionCounts = {})
            const selections = Array.isArray(value) ? value : [value]

            selections.forEach((selection) => {
              const normalized = String(selection).trim()
              if (!normalized) return
              optionCounts[normalized] = (optionCounts[normalized] || 0) + 1
            })
          } else if (question.type === 'yes_no') {
            const optionCounts = summary.optionCounts || (summary.optionCounts = { Yes: 0, No: 0 })
            const normalized = String(value).trim().toLowerCase()
            if (normalized === 'yes') {
              optionCounts.Yes = (optionCounts.Yes || 0) + 1
            } else if (normalized === 'no') {
              optionCounts.No = (optionCounts.No || 0) + 1
            }
          }
        }
      }
    })

    const userRecordRaw = unwrapRelation(response.users as { id?: string; name?: string; email?: string } | { id?: string; name?: string; email?: string }[])
    const eventRecordRaw = unwrapRelation(response.events as { id: string; title: string; date: string; start_time: string; end_time: string } | { id: string; title: string; date: string; start_time: string; end_time: string }[])

    const resolvedUser = anonymousEnabled
      ? { id: null, name: 'Anonymous', email: null }
      : {
          id: userRecordRaw?.id || response.user_id,
          name: userRecordRaw?.name || null,
          email: userRecordRaw?.email || null
        }

    return {
      id: response.id,
      completedAt: response.completed_at,
      createdAt: response.created_at,
      user: resolvedUser,
      responses: processedResponses,
      event: eventRecordRaw
        ? {
            id: eventRecordRaw.id,
            title: eventRecordRaw.title,
            date: eventRecordRaw.date,
            startTime: eventRecordRaw.start_time,
            endTime: eventRecordRaw.end_time,
            locationName: null
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

  const summary: FeedbackSummary = {
    totalResponses: formattedResponses.length,
    averageRating: ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : null,
    ratingDistribution,
    questionSummaries
  }

  const linkedEvent = feedbackForm.event_id ? await loadEvent(feedbackForm.event_id) : null
  const coverage = await loadCoverage(feedbackForm.event_id, formattedResponses.length)

  return {
    ok: true,
    data: {
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
      summary,
      linkedEvent,
      coverage
    }
  }
}
