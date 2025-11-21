import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase';
import { sendBookingReminder } from '@/lib/push/bookingNotifications';

export const dynamic = 'force-dynamic';

// Batch size to prevent Vercel timeout
const BATCH_SIZE = 25;

/**
 * Cron job endpoint for booking reminder notifications
 * Runs every 15 minutes (configured in vercel.json)
 * Processes pending booking_reminder_24h, booking_reminder_1h, and booking_reminder_start tasks
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date();

    // Find pending booking reminder tasks that should run now
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('cron_tasks')
      .select('id, task_type, idempotency_key, run_at, metadata')
      .in('task_type', ['booking_reminder_24h', 'booking_reminder_1h', 'booking_reminder_start'])
      .eq('status', 'pending')
      .lte('run_at', now.toISOString())
      .order('run_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (tasksError) {
      console.error('Error querying booking reminder tasks:', tasksError);
      return NextResponse.json(
        { error: 'Failed to query tasks' },
        { status: 500 }
      );
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        success: true,
        remindersSent: 0,
        message: 'No pending booking reminder tasks',
      });
    }

    let remindersSent = 0;
    let remindersFailed = 0;
    const taskIds: string[] = [];

    for (const task of tasks) {
      try {
        const bookingId = task.metadata?.booking_id;
        if (!bookingId) {
          console.warn(`Task ${task.id} missing booking_id in metadata`);
          continue;
        }

        let reminderType: '24h' | '1h' | 'start';
        if (task.task_type === 'booking_reminder_24h') {
          reminderType = '24h';
        } else if (task.task_type === 'booking_reminder_1h') {
          reminderType = '1h';
        } else {
          reminderType = 'start';
        }

        const result = await sendBookingReminder(bookingId, reminderType);

        remindersSent += result.sent;
        remindersFailed += result.failed;

        // Mark task as completed
        taskIds.push(task.id);
      } catch (error) {
        console.error(`Error processing booking reminder task ${task.id}:`, error);
        remindersFailed++;

        // Mark task as failed
        await supabaseAdmin
          .from('cron_tasks')
          .update({
            status: 'failed',
            error_message: String(error),
            processed_at: new Date().toISOString(),
          })
          .eq('id', task.id);
      }
    }

    // Mark completed tasks
    if (taskIds.length > 0) {
      await supabaseAdmin
        .from('cron_tasks')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .in('id', taskIds);
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      remindersFailed,
      tasksProcessed: tasks.length,
      message: `Processed ${tasks.length} booking reminder task(s)`,
    });
  } catch (error) {
    console.error('Error in booking reminders cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

