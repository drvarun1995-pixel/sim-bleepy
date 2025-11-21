import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { sendFeedbackFormEmail } from '@/lib/email'
import { logError, logInfo, logWarning } from '@/lib/logger'
import { sendFeedbackRequestNotification } from '@/lib/push/feedbackNotifications'

export const dynamic = 'force-dynamic'

// Batch size to prevent Vercel timeout
const BATCH_SIZE = 25

// Simple endpoint to send feedback invites after event end.
// Uses cron_tasks table to prevent duplication and enable idempotent email sending.
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    
    // Find pending tasks that should run now (run_at <= now, status = 'pending')
    // Limit to BATCH_SIZE to prevent timeout
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('cron_tasks')
      .select('id, event_id, idempotency_key, run_at')
      .eq('task_type', 'feedback_invites')
      .eq('status', 'pending')
      .lte('run_at', now.toISOString())
      .order('run_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (tasksError) {
      console.error('Error querying cron tasks:', tasksError)
      await logError(
        'Failed to query feedback invite cron tasks',
        tasksError,
        { taskType: 'feedback_invites', batchSize: BATCH_SIZE },
        '/api/jobs/feedback-invites'
      )
      return NextResponse.json({ error: 'Failed to query tasks' }, { status: 500 })
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ success: true, invitesSent: 0, message: 'No pending tasks' })
    }

    let invitesSent = 0
    const taskIds: string[] = []

    for (const task of tasks) {
      try {
        // Get event details
        const { data: event, error: eventError } = await supabaseAdmin
          .from('events')
          .select('id, title, date, end_time, booking_enabled, feedback_enabled, qr_attendance_enabled')
          .eq('id', task.event_id)
          .single()

        if (eventError || !event) {
          await supabaseAdmin
            .from('cron_tasks')
            .update({ status: 'failed', error_message: 'Event not found' })
            .eq('id', task.id)
          await logError(
            'Event not found for feedback invite task',
            eventError || new Error('Event not found'),
            { taskId: task.id, eventId: task.event_id },
            '/api/jobs/feedback-invites'
          )
          continue
        }

        // Only send for workflows where we deferred the email (booking_enabled true)
        if (!event.booking_enabled || !event.feedback_enabled) {
          await supabaseAdmin
            .from('cron_tasks')
            .update({ status: 'completed', processed_at: now.toISOString() })
            .eq('id', task.id)
          continue
        }

        // Active form for event
        const { data: activeForm } = await supabaseAdmin
          .from('feedback_forms')
          .select('id')
          .eq('event_id', event.id)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!activeForm?.id) {
          await supabaseAdmin
            .from('cron_tasks')
            .update({ status: 'completed', processed_at: now.toISOString() })
            .eq('id', task.id)
          continue
        }

        // Get eligible users based on workflow
        // Workflow 1-3: QR enabled -> users who scanned QR
        // Workflow 7: QR disabled, booking enabled -> users with confirmed bookings
        let uniqueUserIds: string[] = []

        if (event.qr_attendance_enabled) {
          // Workflow 1-3: Use QR scans
          const { data: qrRows } = await supabaseAdmin
            .from('event_qr_codes')
            .select('id')
            .eq('event_id', event.id)

          const qrIds = (qrRows || []).map((r: any) => r.id)
          if (qrIds.length === 0) {
            await supabaseAdmin
              .from('cron_tasks')
              .update({ status: 'completed', processed_at: now.toISOString() })
              .eq('id', task.id)
            continue
          }

          const { data: scans } = await supabaseAdmin
            .from('qr_code_scans')
            .select('user_id')
            .in('qr_code_id', qrIds)
            .eq('scan_success', true)

          uniqueUserIds = Array.from(new Set((scans || []).map((s: any) => s.user_id)))
        } else {
          // Workflow 7: Use confirmed bookings (QR disabled, booking enabled)
          const { data: bookings } = await supabaseAdmin
            .from('event_bookings')
            .select('user_id')
            .eq('event_id', event.id)
            .eq('status', 'confirmed')
            .neq('status', 'cancelled')
            .is('deleted_at', null)

          uniqueUserIds = Array.from(new Set((bookings || []).map((b: any) => b.user_id)))
        }

        if (uniqueUserIds.length === 0) {
          await supabaseAdmin
            .from('cron_tasks')
            .update({ status: 'completed', processed_at: now.toISOString() })
            .eq('id', task.id)
          continue
        }

        // Lookup emails
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .in('id', uniqueUserIds)

        // Send push notification once per task (sends to all event participants)
        try {
          await sendFeedbackRequestNotification(event.id)
          const notificationType = task.task_type === 'feedback_invites_next_day' 
            ? 'next day reminder' 
            : 'immediate'
          console.log(`📱 Push notification sent for feedback request (${notificationType})`)
        } catch (pushError) {
          console.error('Error sending feedback push notification:', pushError)
          // Don't fail email sending if push notification fails
        }

        // Send emails with idempotency check
        for (const u of users || []) {
          // Generate idempotency key per user
          const userTaskIdempotencyKey = `${task.idempotency_key}|${u.id}`
          
          // Check if we already processed this user for this task
          const { data: existingTask } = await supabaseAdmin
            .from('cron_tasks')
            .select('id')
            .eq('idempotency_key', userTaskIdempotencyKey)
            .maybeSingle()

          if (existingTask) {
            continue // Already processed
          }

          try {
            await sendFeedbackFormEmail({
              recipientEmail: u.email,
              recipientName: u.name,
              eventTitle: event.title,
              eventDate: event.date,
              eventTime: event.end_time || '',
              feedbackFormUrl: `${process.env.NEXTAUTH_URL}/feedback/${activeForm.id}`
            })

            // Mark individual user task as completed
            try {
              await supabaseAdmin
                .from('cron_tasks')
                .insert({
                  task_type: 'feedback_invites',
                  event_id: event.id,
                  user_id: u.id,
                  status: 'completed',
                  run_at: task.run_at,
                  processed_at: now.toISOString(),
                  idempotency_key: userTaskIdempotencyKey
                })
            } catch (e) {
              // Ignore duplicate key errors
            }

            invitesSent += 1

            await logInfo(
              'Feedback invite email sent successfully',
              {
                taskId: task.id,
                eventId: event.id,
                eventTitle: event.title,
                userId: u.id,
                userEmail: u.email,
                feedbackFormId: activeForm.id
              },
              '/api/jobs/feedback-invites',
              u.id
            )
          } catch (e) {
            console.error('Failed to send feedback invite', { eventId: event.id, userId: u.id }, e)
            await logError(
              'Failed to send feedback invite email',
              e instanceof Error ? e : new Error(String(e)),
              {
                taskId: task.id,
                eventId: event.id,
                eventTitle: event.title,
                userId: u.id,
                userEmail: u.email,
                feedbackFormId: activeForm.id
              },
              '/api/jobs/feedback-invites',
              u.id
            )
            // Still mark as attempted to prevent infinite retries
            try {
              await supabaseAdmin
                .from('cron_tasks')
                .insert({
                  task_type: 'feedback_invites',
                  event_id: event.id,
                  user_id: u.id,
                  status: 'failed',
                  run_at: task.run_at,
                  processed_at: now.toISOString(),
                  idempotency_key: userTaskIdempotencyKey,
                  error_message: String(e)
                })
            } catch (insertError) {
              // Ignore duplicate key errors
            }
          }
        }

        // Mark main task as completed
        taskIds.push(task.id)
      } catch (error) {
        console.error('Error processing task:', task.id, error)
        await supabaseAdmin
          .from('cron_tasks')
          .update({ 
            status: 'failed', 
            error_message: String(error),
            processed_at: now.toISOString()
          })
          .eq('id', task.id)
        await logError(
          'Error processing feedback invite task',
          error instanceof Error ? error : new Error(String(error)),
          {
            taskId: task.id,
            eventId: task.event_id,
            idempotencyKey: task.idempotency_key
          },
          '/api/jobs/feedback-invites'
        )
      }
    }

    // Mark all successfully processed tasks as completed
    if (taskIds.length > 0) {
      await supabaseAdmin
        .from('cron_tasks')
        .update({ status: 'completed', processed_at: now.toISOString() })
        .in('id', taskIds)
    }

    return NextResponse.json({ 
      success: true, 
      invitesSent, 
      tasksProcessed: taskIds.length,
      now: now.toISOString() 
    })
  } catch (error) {
    console.error('Error in feedback invites job:', error)
    await logError(
      'Critical error in feedback invites cron job',
      error instanceof Error ? error : new Error(String(error)),
      { batchSize: BATCH_SIZE },
      '/api/jobs/feedback-invites'
    )
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Vercel Cron issues GET requests by default; support GET by delegating to POST.
export async function GET(request: NextRequest) {
  return POST(request)
}


