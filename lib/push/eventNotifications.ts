/**
 * Event notification service
 * Handles event reminders, updates, and cancellations
 */

import { supabaseAdmin } from '@/utils/supabase';
import { sendToCohort, sendToUser, formatEventDateTime } from './notificationService';
import { NotificationPayload } from './types';

/**
 * Schedule event reminder notifications
 * Creates cron tasks for 1 hour before and 15 minutes before event start
 */
export async function scheduleEventReminders(
  eventId: string,
  eventData: {
    date: string;
    start_time?: string | null;
    target_cohorts?: string[] | null;
  }
): Promise<{ created: number; message: string }> {
  try {
    if (!eventData.target_cohorts || eventData.target_cohorts.length === 0) {
      return { created: 0, message: 'No target cohorts specified' };
    }

    const startTime = eventData.start_time || '00:00:00';
    const eventStartDate = new Date(`${eventData.date}T${startTime}Z`);

    // Only schedule if event hasn't started yet
    if (eventStartDate <= new Date()) {
      return { created: 0, message: 'Event has already started' };
    }

    let tasksCreated = 0;

    // Task 1: 1 hour before
    const reminder1hDate = new Date(eventStartDate.getTime() - 60 * 60 * 1000);
    if (reminder1hDate > new Date()) {
      const idempotencyKey1h = `event_reminder_1h|${eventId}|${eventData.date}`;

      const { data: existing1h } = await supabaseAdmin
        .from('cron_tasks')
        .select('id')
        .eq('idempotency_key', idempotencyKey1h)
        .maybeSingle();

      if (!existing1h) {
        const { error } = await supabaseAdmin.from('cron_tasks').insert({
          task_type: 'event_reminder_1h',
          event_id: eventId,
          user_id: null,
          status: 'pending',
          run_at: reminder1hDate.toISOString(),
          idempotency_key: idempotencyKey1h,
        });

        if (!error) {
          tasksCreated++;
        }
      }
    }

    // Task 2: 15 minutes before
    const reminder15mDate = new Date(eventStartDate.getTime() - 15 * 60 * 1000);
    if (reminder15mDate > new Date()) {
      const idempotencyKey15m = `event_reminder_15m|${eventId}|${eventData.date}`;

      const { data: existing15m } = await supabaseAdmin
        .from('cron_tasks')
        .select('id')
        .eq('idempotency_key', idempotencyKey15m)
        .maybeSingle();

      if (!existing15m) {
        const { error } = await supabaseAdmin.from('cron_tasks').insert({
          task_type: 'event_reminder_15m',
          event_id: eventId,
          user_id: null,
          status: 'pending',
          run_at: reminder15mDate.toISOString(),
          idempotency_key: idempotencyKey15m,
        });

        if (!error) {
          tasksCreated++;
        }
      }
    }

    return {
      created: tasksCreated,
      message: `Created ${tasksCreated} reminder task(s)`,
    };
  } catch (error) {
    console.error('Error scheduling event reminders:', error);
    return { created: 0, message: String(error) };
  }
}

/**
 * Send event reminder notification
 */
export async function sendEventReminder(
  eventId: string,
  reminderType: '1h' | '15m'
): Promise<{ sent: number; failed: number }> {
  try {
    // Fetch event details
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('id, title, date, start_time, target_cohorts')
      .eq('id', eventId)
      .single();

    if (error || !event || !event.target_cohorts || event.target_cohorts.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const dateTimeStr = formatEventDateTime(event.date, event.start_time);
    const reminderText =
      reminderType === '1h'
        ? 'starts in 1 hour'
        : 'starts in 15 minutes';

    const payload: NotificationPayload = {
      title: `Reminder: ${event.title}`,
      body: `${event.title} ${reminderText} on ${dateTimeStr}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sim.bleepy.co.uk'}/events/${eventId}`,
      data: {
        type: 'event',
        id: eventId,
      },
    };

    return await sendToCohort(
      event.target_cohorts,
      payload,
      reminderType === '1h' ? 'event_reminder_1h' : 'event_reminder_15m',
      { eventId, reminderType }
    );
  } catch (error) {
    console.error('Error sending event reminder:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send event update notification (status change)
 */
export async function sendEventUpdate(eventId: string): Promise<{ sent: number; failed: number }> {
  try {
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('id, title, date, start_time, target_cohorts, event_status')
      .eq('id', eventId)
      .single();

    if (error || !event || !event.target_cohorts || event.target_cohorts.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const dateTimeStr = formatEventDateTime(event.date, event.start_time);
    const statusText = event.event_status || 'updated';

    const payload: NotificationPayload = {
      title: `Event Updated: ${event.title}`,
      body: `The event "${event.title}" scheduled for ${dateTimeStr} has been ${statusText}.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sim.bleepy.co.uk'}/events/${eventId}`,
      data: {
        type: 'event',
        id: eventId,
      },
    };

    return await sendToCohort(event.target_cohorts, payload, 'event_update', {
      eventId,
      status: statusText,
    });
  } catch (error) {
    console.error('Error sending event update:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send event cancellation notification
 */
export async function sendEventCancellation(eventId: string): Promise<{ sent: number; failed: number }> {
  try {
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('id, title, date, start_time, target_cohorts')
      .eq('id', eventId)
      .single();

    if (error || !event || !event.target_cohorts || event.target_cohorts.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const dateTimeStr = formatEventDateTime(event.date, event.start_time);

    const payload: NotificationPayload = {
      title: `Event Cancelled: ${event.title}`,
      body: `The event "${event.title}" scheduled for ${dateTimeStr} has been cancelled.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sim.bleepy.co.uk'}/events`,
      data: {
        type: 'event',
        id: eventId,
      },
    };

    return await sendToCohort(event.target_cohorts, payload, 'event_cancellation', {
      eventId,
    });
  } catch (error) {
    console.error('Error sending event cancellation:', error);
    return { sent: 0, failed: 0 };
  }
}

