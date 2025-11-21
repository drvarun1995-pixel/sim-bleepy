/**
 * Booking notification service
 * Handles booking reminders, waitlist promotions, and cancellations
 */

import { supabaseAdmin } from '@/utils/supabase';
import { sendToUser, sendToMultipleUsers, formatEventDateTime } from './notificationService';
import { NotificationPayload } from './types';

/**
 * Send waitlist promotion notification
 */
export async function sendWaitlistPromotedNotification(
  bookingId: string
): Promise<{ sent: number; failed: number }> {
  try {
    // Fetch booking with event details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id,
        user_id,
        event_id,
        events (
          id,
          title,
          date,
          start_time,
          location_id,
          locations (name, address)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return { sent: 0, failed: 0 };
    }

    const event = booking.events as any;
    const location = event.locations as any;
    const dateTimeStr = formatEventDateTime(event.date, event.start_time);
    const locationStr = location?.name || location?.address || '';

    const payload: NotificationPayload = {
      title: 'Booking Confirmed',
      body: `Your booking for "${event.title}" on ${dateTimeStr}${locationStr ? ` at ${locationStr}` : ''} has been confirmed.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sim.bleepy.co.uk'}/events/${event.id}`,
      data: {
        type: 'booking',
        id: bookingId,
        eventId: event.id,
      },
    };

    return await sendToUser(booking.user_id, payload, 'booking_waitlist_promoted', {
      bookingId,
      eventId: event.id,
    });
  } catch (error) {
    console.error('Error sending waitlist promotion notification:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send booking reminder notification
 */
export async function sendBookingReminder(
  bookingId: string,
  reminderType: '24h' | '1h' | 'start'
): Promise<{ sent: number; failed: number }> {
  try {
    // Fetch booking with event details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id,
        user_id,
        event_id,
        events (
          id,
          title,
          date,
          start_time,
          location_id,
          locations (name, address)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return { sent: 0, failed: 0 };
    }

    const event = booking.events as any;
    const location = event.locations as any;
    const dateTimeStr = formatEventDateTime(event.date, event.start_time);
    const locationStr = location?.name || location?.address || '';

    let title = '';
    let body = '';

    if (reminderType === '24h') {
      title = 'Reminder: Your Booking Tomorrow';
      body = `You have a booking for "${event.title}" tomorrow at ${dateTimeStr}${locationStr ? ` at ${locationStr}` : ''}.`;
    } else if (reminderType === '1h') {
      title = 'Reminder: Your Booking in 1 Hour';
      body = `Your booking for "${event.title}" starts in 1 hour at ${dateTimeStr}${locationStr ? ` at ${locationStr}` : ''}.`;
    } else {
      // start
      title = 'Your Event Starts Now';
      body = `"${event.title}" is starting now at ${dateTimeStr}${locationStr ? ` at ${locationStr}` : ''}.`;
    }

    const payload: NotificationPayload = {
      title,
      body,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sim.bleepy.co.uk'}/events/${event.id}`,
      data: {
        type: 'booking',
        id: bookingId,
        eventId: event.id,
      },
    };

    const notificationType =
      reminderType === '24h'
        ? 'booking_reminder_24h'
        : reminderType === '1h'
        ? 'booking_reminder_1h'
        : 'booking_reminder_start';

    return await sendToUser(booking.user_id, payload, notificationType, {
      bookingId,
      eventId: event.id,
      reminderType,
    });
  } catch (error) {
    console.error('Error sending booking reminder:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send admin cancellation notification
 */
export async function sendAdminCancellationNotification(
  bookingId: string
): Promise<{ sent: number; failed: number }> {
  try {
    // Fetch booking with event details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id,
        user_id,
        event_id,
        events (
          id,
          title,
          date,
          start_time
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return { sent: 0, failed: 0 };
    }

    const event = booking.events as any;
    const dateTimeStr = formatEventDateTime(event.date, event.start_time);

    const payload: NotificationPayload = {
      title: 'Booking Cancelled',
      body: `Your booking for "${event.title}" on ${dateTimeStr} has been cancelled by the administrator.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sim.bleepy.co.uk'}/events`,
      data: {
        type: 'booking',
        id: bookingId,
        eventId: event.id,
      },
    };

    return await sendToUser(booking.user_id, payload, 'booking_admin_cancelled', {
      bookingId,
      eventId: event.id,
    });
  } catch (error) {
    console.error('Error sending admin cancellation notification:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Schedule booking reminders for a booking
 * Creates cron tasks for 24h before, 1h before, and when event starts
 */
export async function scheduleBookingReminders(
  bookingId: string,
  eventDate: string,
  eventStartTime?: string | null
): Promise<{ created: number; message: string }> {
  try {
    const startTime = eventStartTime || '00:00:00';
    const eventStartDate = new Date(`${eventDate}T${startTime}Z`);

    // Only schedule if event hasn't started yet
    if (eventStartDate <= new Date()) {
      return { created: 0, message: 'Event has already started' };
    }

    let tasksCreated = 0;

    // Task 1: 24 hours before
    const reminder24hDate = new Date(eventStartDate.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24hDate > new Date()) {
      const idempotencyKey24h = `booking_reminder_24h|${bookingId}|${eventDate}`;

      const { data: existing24h } = await supabaseAdmin
        .from('cron_tasks')
        .select('id')
        .eq('idempotency_key', idempotencyKey24h)
        .maybeSingle();

      if (!existing24h) {
        const { error } = await supabaseAdmin.from('cron_tasks').insert({
          task_type: 'booking_reminder_24h',
          event_id: null, // Will be set from booking
          user_id: null, // Will be set from booking
          status: 'pending',
          run_at: reminder24hDate.toISOString(),
          idempotency_key: idempotencyKey24h,
          metadata: { booking_id: bookingId },
        });

        if (!error) {
          tasksCreated++;
        }
      }
    }

    // Task 2: 1 hour before
    const reminder1hDate = new Date(eventStartDate.getTime() - 60 * 60 * 1000);
    if (reminder1hDate > new Date()) {
      const idempotencyKey1h = `booking_reminder_1h|${bookingId}|${eventDate}`;

      const { data: existing1h } = await supabaseAdmin
        .from('cron_tasks')
        .select('id')
        .eq('idempotency_key', idempotencyKey1h)
        .maybeSingle();

      if (!existing1h) {
        const { error } = await supabaseAdmin.from('cron_tasks').insert({
          task_type: 'booking_reminder_1h',
          event_id: null,
          user_id: null,
          status: 'pending',
          run_at: reminder1hDate.toISOString(),
          idempotency_key: idempotencyKey1h,
          metadata: { booking_id: bookingId },
        });

        if (!error) {
          tasksCreated++;
        }
      }
    }

    // Task 3: When event starts
    const idempotencyKeyStart = `booking_reminder_start|${bookingId}|${eventDate}`;

    const { data: existingStart } = await supabaseAdmin
      .from('cron_tasks')
      .select('id')
      .eq('idempotency_key', idempotencyKeyStart)
      .maybeSingle();

    if (!existingStart) {
      const { error } = await supabaseAdmin.from('cron_tasks').insert({
        task_type: 'booking_reminder_start',
        event_id: null,
        user_id: null,
        status: 'pending',
        run_at: eventStartDate.toISOString(),
        idempotency_key: idempotencyKeyStart,
        metadata: { booking_id: bookingId },
      });

      if (!error) {
        tasksCreated++;
      }
    }

    return {
      created: tasksCreated,
      message: `Created ${tasksCreated} booking reminder task(s)`,
    };
  } catch (error) {
    console.error('Error scheduling booking reminders:', error);
    return { created: 0, message: String(error) };
  }
}

