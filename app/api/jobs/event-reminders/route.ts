import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase';
import { sendEventReminder } from '@/lib/push/eventNotifications';

export const dynamic = 'force-dynamic';

// Batch size to prevent Vercel timeout
const BATCH_SIZE = 25;

/**
 * Cron job endpoint for event reminder notifications
 * Runs every 15 minutes (configured in vercel.json)
 * Processes pending event_reminder_1h and event_reminder_15m tasks
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date();

    // Find pending reminder tasks that should run now
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('cron_tasks')
      .select('id, event_id, task_type, idempotency_key, run_at')
      .in('task_type', ['event_reminder_1h', 'event_reminder_15m'])
      .eq('status', 'pending')
      .lte('run_at', now.toISOString())
      .order('run_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (tasksError) {
      console.error('Error querying event reminder tasks:', tasksError);
      return NextResponse.json(
        { error: 'Failed to query tasks' },
        { status: 500 }
      );
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        success: true,
        remindersSent: 0,
        message: 'No pending reminder tasks',
      });
    }

    let remindersSent = 0;
    let remindersFailed = 0;
    const taskIds: string[] = [];

    for (const task of tasks) {
      try {
        const reminderType = task.task_type === 'event_reminder_1h' ? '1h' : '15m';
        const result = await sendEventReminder(task.event_id, reminderType);

        remindersSent += result.sent;
        remindersFailed += result.failed;

        // Mark task as completed
        taskIds.push(task.id);
      } catch (error) {
        console.error(`Error processing reminder task ${task.id}:`, error);
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
      message: `Processed ${tasks.length} reminder task(s)`,
    });
  } catch (error) {
    console.error('Error in event reminders cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

