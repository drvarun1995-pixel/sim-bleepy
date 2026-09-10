import { supabaseAdmin } from '@/utils/supabase'
import { createCronTasksForEvent } from '@/lib/cron-tasks'
import { ensureFeedbackFormQr } from '@/lib/feedback/form-qr'

type CreateEventInstanceInput = {
  eventRow: Record<string, any>
  speakerIds: string[]
  categoryIds: string[]
  locationIds: string[]
  organizerIds: string[]
  userId?: string | null
  originalEventData: Record<string, any>
}

async function linkRows(
  table: 'event_categories' | 'event_locations' | 'event_organizers' | 'event_speakers',
  eventId: string,
  foreignKey: string,
  ids: string[]
) {
  if (ids.length === 0) return
  const rows = ids.map((id) => ({ event_id: eventId, [foreignKey]: id }))
  const { error } = await supabaseAdmin.from(table).insert(rows)
  if (error) {
    console.error(`Error linking ${table} for series instance ${eventId}:`, error)
  }
}

async function createFeedbackFormForEvent(
  eventId: string,
  eventTitle: string,
  eventData: Record<string, any>,
  userId?: string | null
) {
  const isFeedbackEnabled = !!(
    eventData.feedbackEnabled ||
    eventData.feedback_enabled ||
    eventData.feedback_enabled
  )
  if (!isFeedbackEnabled) return

  let form_template: 'workshop' | 'seminar' | 'clinical_skills' | 'custom' = 'workshop'
  let questions: any[] | undefined
  let anonymousEnabled = false
  const selectedTemplate =
    eventData.feedbackFormTemplate && typeof eventData.feedbackFormTemplate === 'string'
      ? eventData.feedbackFormTemplate
      : 'auto-generate'

  if (selectedTemplate === 'auto-generate') {
    form_template = 'custom'
    questions = [
      { type: 'rating', question: 'How would you rate this event?', required: true, scale: 5 },
      { type: 'text', question: 'What did you learn from this event?', required: false },
      { type: 'yes_no', question: 'Would you recommend this event to others?', required: true },
    ]
  } else if (['workshop', 'seminar', 'clinical_skills', 'custom'].includes(selectedTemplate)) {
    form_template = selectedTemplate as typeof form_template
    questions = eventData.feedbackCustomQuestions || undefined
  } else {
    const { data: tpl } = await supabaseAdmin
      .from('feedback_templates')
      .select('id, category, questions, usage_count, anonymous_enabled')
      .eq('id', selectedTemplate)
      .single()

    if (tpl) {
      const allowedTemplates = ['workshop', 'seminar', 'clinical_skills', 'custom'] as const
      form_template = allowedTemplates.includes(tpl.category as any)
        ? (tpl.category as typeof allowedTemplates[number])
        : 'custom'
      questions = (tpl.questions as any[]) || []
      anonymousEnabled = Boolean((tpl as any).anonymous_enabled)
    } else {
      form_template = 'custom'
      questions = [
        { type: 'rating', question: 'How would you rate this event?', required: true, scale: 5 },
        { type: 'text', question: 'What did you learn from this event?', required: false },
        { type: 'yes_no', question: 'Would you recommend this event to others?', required: true },
      ]
    }
  }

  const { data: insertedForm, error: insertFormError } = await supabaseAdmin
    .from('feedback_forms')
    .insert({
      event_id: eventId,
      form_name: `Feedback for ${eventTitle}`,
      form_template,
      questions: questions || null,
      anonymous_enabled:
        eventData.feedbackAnonymousEnabled !== undefined
          ? Boolean(eventData.feedbackAnonymousEnabled)
          : anonymousEnabled,
      active: true,
      created_by: userId || null,
    })
    .select('id, event_id, anonymous_enabled')
    .single()

  if (insertFormError) {
    console.error('Failed to auto-create feedback form for series instance:', insertFormError)
    return
  }

  if (insertedForm?.id) {
    await ensureFeedbackFormQr(insertedForm, eventTitle)
  }
}

export async function createAdditionalSeriesInstance(input: CreateEventInstanceInput) {
  const { data: newEvent, error: eventError } = await supabaseAdmin
    .from('events')
    .insert([input.eventRow])
    .select()
    .single()

  if (eventError || !newEvent) {
    console.error('Error creating series instance:', eventError)
    throw eventError || new Error('Failed to create series instance')
  }

  await linkRows('event_categories', newEvent.id, 'category_id', input.categoryIds)
  await linkRows('event_locations', newEvent.id, 'location_id', input.locationIds)
  await linkRows('event_organizers', newEvent.id, 'organizer_id', input.organizerIds)
  await linkRows('event_speakers', newEvent.id, 'speaker_id', input.speakerIds)

  if (input.eventRow.qr_attendance_enabled) {
    try {
      const qrResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/qr-codes/auto-generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: newEvent.id }),
        }
      )
      if (!qrResponse.ok) {
        console.error('Failed to auto-generate QR code for series instance:', await qrResponse.text())
      }
    } catch (qrError) {
      console.error('Error auto-generating QR code for series instance:', qrError)
    }
  }

  try {
    await createFeedbackFormForEvent(
      newEvent.id,
      input.originalEventData.title || newEvent.title,
      input.originalEventData,
      input.userId
    )
  } catch (feedbackError) {
    console.error('Error auto-creating feedback form for series instance:', feedbackError)
  }

  try {
    await createCronTasksForEvent(newEvent.id, {
      date: newEvent.date,
      end_time: newEvent.end_time,
      start_time: newEvent.start_time,
      booking_enabled: newEvent.booking_enabled,
      feedback_enabled: newEvent.feedback_enabled,
      auto_generate_certificate: newEvent.auto_generate_certificate,
      certificate_template_id: newEvent.certificate_template_id,
      target_cohorts: newEvent.target_cohorts || null,
    })
  } catch (cronError) {
    console.error('Error creating cron tasks for series instance:', cronError)
  }

  return newEvent
}
