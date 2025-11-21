/**
 * Feedback notification service
 */

import { supabaseAdmin } from '@/utils/supabase';
import { sendToMultipleUsers } from './notificationService';
import { NotificationPayload } from './types';

/**
 * Send feedback request notification
 * Sends to all users who booked the event
 */
export async function sendFeedbackRequestNotification(
  eventId: string
): Promise<{ sent: number; failed: number }> {
  try {
    // Fetch event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return { sent: 0, failed: 0 };
    }

    // Get all users who booked this event
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('event_bookings')
      .select('user_id')
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'attended']);

    if (bookingsError || !bookings || bookings.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const userIds = bookings.map(b => b.user_id);

    const payload: NotificationPayload = {
      title: 'Share Your Feedback',
      body: `We'd love to hear your thoughts on "${event.title}". Please share your feedback.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sim.bleepy.co.uk'}/events/${eventId}/feedback`,
      data: {
        type: 'feedback',
        id: eventId,
      },
    };

    return await sendToMultipleUsers(userIds, payload, 'feedback_request', {
      eventId,
    });
  } catch (error) {
    console.error('Error sending feedback request notification:', error);
    return { sent: 0, failed: 0 };
  }
}

