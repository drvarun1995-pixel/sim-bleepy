import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { sendFeedbackFormEmail } from '@/lib/email'

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
          .select('id, title, date, end_time, booking_enabled, feedback_enabled')
          .eq('id', task.event_id)
          .single()

        if (eventError || !event) {
          await supabaseAdmin
            .from('cron_tasks')
            .update({ status: 'failed', error_message: 'Event not found' })
            .eq('id', task.id)
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

        // Users who scanned attendance successfully
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

        const uniqueUserIds = Array.from(new Set((scans || []).map((s: any) => s.user_id)))
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
              .catch(() => {}) // Ignore duplicate key errors

            invitesSent += 1
          } catch (e) {
            console.error('Failed to send feedback invite', { eventId: event.id, userId: u.id }, e)
            // Still mark as attempted to prevent infinite retries
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
              .catch(() => {})
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Vercel Cron issues GET requests by default; support GET by delegating to POST.
export async function GET(request: NextRequest) {
  return POST(request)
}


