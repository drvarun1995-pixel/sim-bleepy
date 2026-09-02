import { supabaseAdmin } from '@/utils/supabase'
import { sendAttendanceThankYouEmail } from '@/lib/email'
import { ukEventDateTimeToUtc } from '@/lib/ukEventTime'

type EventFlags = {
  booking_enabled?: boolean | null
  feedback_enabled?: boolean | null
  auto_generate_certificate?: boolean | null
  certificate_template_id?: string | null
  feedback_required_for_certificate?: boolean | null
  date?: string | null
  start_time?: string | null
  end_time?: string | null
}

type EventDetails = {
  title?: string | null
  date?: string | null
  start_time?: string | null
  end_time?: string | null
}

/**
 * Shared post-check-in side effects used by authenticated scan and guest walk-in.
 * Feedback invites are queued for event end (see createCronTasksForEvent), not sent here.
 */
export async function runAttendanceSideEffects(params: {
  user: { id: string; name: string | null; email: string }
  targetEventId: string
  eventFlags: EventFlags | null
  eventDetails: EventDetails | null
  now: Date
  isGuest?: boolean
}): Promise<{ feedbackEmailSent: boolean }> {
  const { user, targetEventId, eventFlags, eventDetails, now } = params

  const shouldCreateCertTask =
    eventFlags?.auto_generate_certificate &&
    eventFlags?.certificate_template_id &&
    !eventFlags?.feedback_required_for_certificate

  if (shouldCreateCertTask) {
    try {
      const eventDate = eventFlags?.date || eventDetails?.date
      const fallbackDate = new Date().toISOString().split('T')[0]
      const eventEndTime =
        eventFlags?.end_time ||
        eventDetails?.end_time ||
        eventFlags?.start_time ||
        eventDetails?.start_time ||
        '23:59:59'

      let taskRunAt = new Date()
      if (eventDate) {
        const parsed = ukEventDateTimeToUtc(eventDate, eventEndTime)
        if (!Number.isNaN(parsed.getTime())) {
          taskRunAt = parsed
        }
      }

      if (taskRunAt < now) {
        taskRunAt = now
      }

      const idempotencyKey = `certificates_auto_generate|${targetEventId}|${user.id}|${eventDate || fallbackDate}`

      const { error: cronError } = await supabaseAdmin.from('cron_tasks').insert({
        task_type: 'certificates_auto_generate',
        event_id: targetEventId,
        user_id: user.id,
        status: 'pending',
        run_at: taskRunAt.toISOString(),
        idempotency_key: idempotencyKey,
      })

      if (cronError && (cronError as any)?.code !== '23505') {
        console.error('Failed to enqueue certificate generation task:', cronError)
      }
    } catch (taskError) {
      console.error('Failed to schedule certificate generation task:', taskError)
    }
  }

  if (
    !eventFlags?.booking_enabled &&
    !eventFlags?.feedback_enabled &&
    !eventFlags?.auto_generate_certificate
  ) {
    try {
      await sendAttendanceThankYouEmail({
        recipientEmail: user.email,
        recipientName: user.name || 'Attendee',
        eventTitle: eventDetails?.title || 'Event',
        eventDate: eventDetails?.date || 'Date not available',
        eventTime: eventDetails?.start_time || 'Time not available',
      })
    } catch (emailError) {
      console.error('Failed to send thank you email:', emailError)
    }
  }

  return { feedbackEmailSent: false }
}
