import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'
import { logError, logInfo, logWarning } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Batch size to prevent Vercel timeout
const BATCH_SIZE = 50

// Job: auto-generate certificates for attendees after event end (not gated by feedback)
// Uses cron_tasks table to prevent duplication and enable idempotent processing.
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    
    // Find pending tasks that should run now (run_at <= now, status = 'pending')
    // Limit to BATCH_SIZE to prevent timeout
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('cron_tasks')
      .select('id, event_id, user_id, idempotency_key, run_at')
      .eq('task_type', 'certificates_auto_generate')
      .eq('status', 'pending')
      .lte('run_at', now.toISOString())
      .order('run_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (tasksError) {
      console.error('Error querying cron tasks:', tasksError)
      await logError(
        'Failed to query certificate generation cron tasks',
        tasksError,
        { taskType: 'certificates_auto_generate', batchSize: BATCH_SIZE },
        '/api/jobs/certificates-auto-generate'
      )
      return NextResponse.json({ error: 'Failed to query tasks' }, { status: 500 })
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ success: true, generated: 0, skipped: 0, emailed: 0, message: 'No pending tasks' })
    }

    let generated = 0
    let skipped = 0
    let emailed = 0
    const taskIds: string[] = []

    for (const task of tasks) {
      try {
        // Get event details
        const { data: event, error: eventError } = await supabaseAdmin
          .from('events')
          .select('id, title, date, start_time, end_time, auto_generate_certificate, certificate_template_id, certificate_auto_send_email, feedback_required_for_certificate')
          .eq('id', task.event_id)
          .single()

        if (eventError || !event) {
          await supabaseAdmin
            .from('cron_tasks')
            .update({ status: 'failed', error_message: 'Event not found' })
            .eq('id', task.id)
          await logError(
            'Event not found for certificate generation task',
            eventError || new Error('Event not found'),
            { taskId: task.id, eventId: task.event_id, userId: task.user_id },
            '/api/jobs/certificates-auto-generate',
            task.user_id || undefined
          )
          continue
        }

        if (!event.auto_generate_certificate || !event.certificate_template_id) {
          await supabaseAdmin
            .from('cron_tasks')
            .update({ status: 'completed', processed_at: now.toISOString() })
            .eq('id', task.id)
          continue
        }

        // If feedback is required for certificate, delete this task - it shouldn't exist in the first place
        // Certificates will be generated after feedback submission instead
        // This task should never have been created, but we clean it up here to prevent confusion
        if (event.feedback_required_for_certificate) {
          console.log(`🗑️ Deleting incorrectly created certificate task ${task.id} - feedback required (certificate will be generated after feedback submission)`)
          await supabaseAdmin
            .from('cron_tasks')
            .delete()
            .eq('id', task.id)
          skipped++
          continue
        }

        // If task has user_id, process single user
        if (task.user_id) {
          // Check if certificate already exists (idempotency)
          const { data: existing } = await supabaseAdmin
            .from('certificates')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', task.user_id)
            .maybeSingle()

          if (existing?.id) {
            await supabaseAdmin
              .from('cron_tasks')
              .update({ status: 'completed', processed_at: now.toISOString() })
              .eq('id', task.id)
            skipped++
            continue
          }

          // Get or create booking
          let bookingId: string | null = null
          const { data: booking } = await supabaseAdmin
            .from('event_bookings')
            .select('id, feedback_completed')
            .eq('event_id', event.id)
            .eq('user_id', task.user_id)
            .neq('status', 'cancelled')
            .maybeSingle()

          if (booking?.id) {
            bookingId = booking.id
          } else {
            const { data: newBooking } = await supabaseAdmin
              .from('event_bookings')
              .insert({ event_id: event.id, user_id: task.user_id, status: 'attended', checked_in: true })
              .select('id')
              .single()
            bookingId = newBooking?.id || null
          }

          if (!bookingId) {
            await supabaseAdmin
              .from('cron_tasks')
              .update({ status: 'failed', error_message: 'Failed to create booking', processed_at: now.toISOString() })
              .eq('id', task.id)
            skipped++
            continue
          }

          // Call internal API to generate
          try {
            const deploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
            const resolvedBaseUrl = [
              deploymentUrl,
              process.env.NEXTAUTH_URL,
              process.env.NEXT_PUBLIC_APP_URL,
              process.env.NEXT_PUBLIC_SITE_URL,
              'https://sim.bleepy.co.uk'
            ].find((value) => value && value.trim().length > 0) || 'https://sim.bleepy.co.uk'

            const apiUrl = new URL('/api/certificates/auto-generate', resolvedBaseUrl)
            const bypassToken = process.env.VERCEL_BYPASS_TOKEN
            if (bypassToken && bypassToken.trim().length > 0) {
              apiUrl.searchParams.set('x-vercel-set-bypass-cookie', 'true')
              apiUrl.searchParams.set('x-vercel-protection-bypass', bypassToken.trim())
            }

            const resolvedCronSecret = (process.env.INTERNAL_CRON_SECRET || process.env.CRON_SECRET || '').trim()

            const fetchHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
              'x-vercel-cron': 'manual'
            }

            if (resolvedCronSecret) {
              fetchHeaders['x-cron-secret'] = resolvedCronSecret
            }

            if (bypassToken && bypassToken.trim().length > 0) {
              fetchHeaders['x-vercel-protection-bypass'] = bypassToken.trim()
            }

            const res = await fetch(apiUrl.toString(), {
              method: 'POST',
              headers: fetchHeaders,
              body: JSON.stringify({
                eventId: event.id,
                userId: task.user_id,
                bookingId,
                templateId: event.certificate_template_id,
                sendEmail: event.certificate_auto_send_email
              })
            })

            if (res.ok) {
              generated++
              if (event.certificate_auto_send_email) emailed++
              taskIds.push(task.id)
              await logInfo(
                'Certificate generated successfully via cron job',
                {
                  taskId: task.id,
                  eventId: event.id,
                  eventTitle: event.title,
                  userId: task.user_id,
                  bookingId,
                  emailSent: event.certificate_auto_send_email
                },
                '/api/jobs/certificates-auto-generate',
                task.user_id || undefined
              )
            } else {
              const errorText = await res.text()
              await supabaseAdmin
                .from('cron_tasks')
                .update({ status: 'failed', error_message: errorText, processed_at: now.toISOString() })
                .eq('id', task.id)
              console.error('Auto-generate cert failed:', errorText)
              await logError(
                'Certificate generation API call failed',
                new Error(errorText),
                {
                  taskId: task.id,
                  eventId: event.id,
                  userId: task.user_id,
                  bookingId,
                  status: res.status,
                  statusText: res.statusText
                },
                '/api/jobs/certificates-auto-generate',
                task.user_id || undefined
              )
            }
          } catch (e) {
            await supabaseAdmin
              .from('cron_tasks')
              .update({ status: 'failed', error_message: String(e), processed_at: now.toISOString() })
              .eq('id', task.id)
            console.error('Cert generation error', e)
            await logError(
              'Exception during certificate generation in cron job',
              e instanceof Error ? e : new Error(String(e)),
              {
                taskId: task.id,
                eventId: event.id,
                userId: task.user_id,
                bookingId
              },
              '/api/jobs/certificates-auto-generate',
              task.user_id || undefined
            )
          }
        } else {
          // Task without user_id is a marker task - find all attendees and create per-user tasks
          // Get attendees who scanned QR successfully
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

          const userIds = Array.from(new Set((scans || []).map((s: any) => s.user_id)))
          if (userIds.length === 0) {
            await supabaseAdmin
              .from('cron_tasks')
              .update({ status: 'completed', processed_at: now.toISOString() })
              .eq('id', task.id)
            continue
          }

          // Create per-user tasks (only if they don't already exist)
          for (const userId of userIds) {
            const userTaskIdempotencyKey = `certificates_auto_generate|${event.id}|${userId}|${event.date}`
            
            // Check if task already exists
            const { data: existing } = await supabaseAdmin
              .from('cron_tasks')
              .select('id')
              .eq('idempotency_key', userTaskIdempotencyKey)
              .maybeSingle()

            if (!existing) {
              try {
                await supabaseAdmin
                  .from('cron_tasks')
                  .insert({
                    task_type: 'certificates_auto_generate',
                    event_id: event.id,
                    user_id: userId,
                    status: 'pending',
                    run_at: task.run_at,
                    idempotency_key: userTaskIdempotencyKey
                  })
              } catch (e) {
                // Ignore duplicate key errors
              }
            }
          }

          // Mark marker task as completed (user tasks will be processed in next run)
          await supabaseAdmin
            .from('cron_tasks')
            .update({ status: 'completed', processed_at: now.toISOString() })
            .eq('id', task.id)
        }
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
          'Error processing certificate generation task',
          error instanceof Error ? error : new Error(String(error)),
          {
            taskId: task.id,
            eventId: task.event_id,
            userId: task.user_id,
            idempotencyKey: task.idempotency_key
          },
          '/api/jobs/certificates-auto-generate',
          task.user_id || undefined
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
      generated, 
      skipped, 
      emailed, 
      tasksProcessed: taskIds.length,
      now: now.toISOString() 
    })
  } catch (error) {
    console.error('Error in certificates job:', error)
    await logError(
      'Critical error in certificate generation cron job',
      error instanceof Error ? error : new Error(String(error)),
      { batchSize: BATCH_SIZE },
      '/api/jobs/certificates-auto-generate'
    )
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Vercel Cron issues GET requests by default; support GET by delegating to POST.
export async function GET(request: NextRequest) {
  return POST(request)
}


