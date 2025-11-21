import { supabaseAdmin } from '@/utils/supabase'
import { scheduleEventReminders } from './push/eventNotifications'

/**
 * Create cron tasks for an event based on its configuration
 * This should be called when events are created or updated
 */
export async function createCronTasksForEvent(eventId: string, eventData: {
  date: string
  end_time?: string | null
  start_time?: string | null
  booking_enabled?: boolean
  feedback_enabled?: boolean
  auto_generate_certificate?: boolean
  certificate_template_id?: string | null
  target_cohorts?: string[] | null
}) {
  try {
    // Calculate event end time
    const eventEndTime = eventData.end_time || eventData.start_time || '23:59:59'
    const eventEndDate = new Date(`${eventData.date}T${eventEndTime}Z`)
    
    // Only create tasks if event hasn't ended yet
    if (eventEndDate <= new Date()) {
      return { created: 0, message: 'Event has already ended' }
    }

    let tasksCreated = 0

    // Task 0: Event reminder notifications (1h and 15m before start)
    if (eventData.target_cohorts && eventData.target_cohorts.length > 0) {
      const reminderResult = await scheduleEventReminders(eventId, {
        date: eventData.date,
        start_time: eventData.start_time,
        target_cohorts: eventData.target_cohorts,
      });
      tasksCreated += reminderResult.created;
    }

    // Task 1: Feedback invites (only if booking_enabled + feedback_enabled)
    if (eventData.booking_enabled && eventData.feedback_enabled) {
      // Immediate feedback invite (at event end)
      const idempotencyKey = `feedback_invites|${eventId}|${eventData.date}`
      
      // Check if task already exists
      const { data: existing } = await supabaseAdmin
        .from('cron_tasks')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (!existing) {
        const { error } = await supabaseAdmin
          .from('cron_tasks')
          .insert({
            task_type: 'feedback_invites',
            event_id: eventId,
            user_id: null, // Batch task
            status: 'pending',
            run_at: eventEndDate.toISOString(),
            idempotency_key: idempotencyKey
          })

        if (!error) {
          tasksCreated++
        } else {
          console.error('Error creating feedback invites task:', error)
        }
      }

      // Next day feedback reminder (24 hours after event end)
      const nextDayDate = new Date(eventEndDate.getTime() + 24 * 60 * 60 * 1000)
      const idempotencyKeyNextDay = `feedback_invites_next_day|${eventId}|${eventData.date}`
      
      const { data: existingNextDay } = await supabaseAdmin
        .from('cron_tasks')
        .select('id')
        .eq('idempotency_key', idempotencyKeyNextDay)
        .maybeSingle()

      if (!existingNextDay) {
        const { error } = await supabaseAdmin
          .from('cron_tasks')
          .insert({
            task_type: 'feedback_invites_next_day',
            event_id: eventId,
            user_id: null,
            status: 'pending',
            run_at: nextDayDate.toISOString(),
            idempotency_key: idempotencyKeyNextDay
          })

        if (!error) {
          tasksCreated++
        } else {
          console.error('Error creating next day feedback reminder task:', error)
        }
      }
    }

    // Task 2: Certificate generation
    // For certificates, we create individual tasks per user after event ends
    // This is handled by the certificates job scanning for attendees
    // We don't pre-create user-specific tasks here - the job will create them dynamically
    // But we can create a marker task for the event
    if (eventData.auto_generate_certificate && eventData.certificate_template_id) {
      const idempotencyKey = `certificates_auto_generate|${eventId}|${eventData.date}`
      
      // Check if marker task already exists
      const { data: existing } = await supabaseAdmin
        .from('cron_tasks')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (!existing) {
        // Create a marker task (without user_id) that the job can use to identify events
        // The job will then create per-user tasks when processing
        const { error } = await supabaseAdmin
          .from('cron_tasks')
          .insert({
            task_type: 'certificates_auto_generate',
            event_id: eventId,
            user_id: null, // Marker task
            status: 'pending',
            run_at: eventEndDate.toISOString(),
            idempotency_key: idempotencyKey
          })

        if (!error) {
          tasksCreated++
        } else {
          console.error('Error creating certificate task:', error)
        }
      }
    }

    return { created: tasksCreated, message: `Created ${tasksCreated} cron task(s)` }
  } catch (error) {
    console.error('Error creating cron tasks for event:', error)
    return { created: 0, error: String(error) }
  }
}

/**
 * Update or recreate cron tasks when event is updated
 * Deletes old tasks and creates new ones
 */
export async function updateCronTasksForEvent(eventId: string, eventData: {
  date: string
  end_time?: string | null
  start_time?: string | null
  booking_enabled?: boolean
  feedback_enabled?: boolean
  auto_generate_certificate?: boolean
  certificate_template_id?: string | null
  target_cohorts?: string[] | null
}) {
  try {
    // Delete old pending tasks for this event (except feedback and certificate tasks that are user-specific)
    await supabaseAdmin
      .from('cron_tasks')
      .delete()
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .in('task_type', ['event_reminder_1h', 'event_reminder_15m'])

    // Create new tasks
    return await createCronTasksForEvent(eventId, eventData)
  } catch (error) {
    console.error('Error updating cron tasks for event:', error)
    return { created: 0, error: String(error) }
  }
}

