/**
 * Core notification service
 * Handles sending notifications to users, cohorts, and managing logs
 */

import { supabaseAdmin } from '@/utils/supabase';
import { sendPushNotification } from './webPushClient';
import { getUsersByCohorts, getSubscriptionsForUsers, filterSubscriptionsByPreferences } from './cohortFiltering';
import { NotificationPayload, NotificationType, NotificationLog } from './types';

/**
 * Send notification to a single user
 */
export async function sendToUser(
  userId: string,
  payload: NotificationPayload,
  notificationType: NotificationType,
  metadata?: Record<string, any>
): Promise<{ sent: number; failed: number }> {
  // Get user's active subscriptions
  const { data: subscriptions, error } = await supabaseAdmin
    .from('user_push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Filter by preferences
  const filteredSubscriptions = await filterSubscriptionsByPreferences(
    subscriptions,
    notificationType
  );

  if (filteredSubscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const subscription of filteredSubscriptions) {
    const result = await sendPushNotification(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      payload
    );

    if (result.success) {
      sent++;
      // Log successful send
      await logNotification({
        user_id: userId,
        notification_type: notificationType,
        title: payload.title,
        body: payload.body,
        url: payload.url,
        status: 'sent',
        metadata,
      });
    } else {
      failed++;
      // Log failure
      await logNotification({
        user_id: userId,
        notification_type: notificationType,
        title: payload.title,
        body: payload.body,
        url: payload.url,
        status: 'failed',
        error_message: result.error,
        metadata,
      });

      // If subscription expired, mark as inactive
      if (result.error === 'Subscription expired') {
        await supabaseAdmin
          .from('user_push_subscriptions')
          .update({ is_active: false })
          .eq('id', subscription.id);
      }
    }
  }

  return { sent, failed };
}

/**
 * Send notification to multiple users
 */
export async function sendToMultipleUsers(
  userIds: string[],
  payload: NotificationPayload,
  notificationType: NotificationType,
  metadata?: Record<string, any>
): Promise<{ sent: number; failed: number }> {
  if (!userIds || userIds.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Get subscriptions for all users
  const subscriptions = await getSubscriptionsForUsers(userIds);

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Filter by preferences
  const filteredSubscriptions = await filterSubscriptionsByPreferences(
    subscriptions,
    notificationType
  );

  if (filteredSubscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // Send in batches to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < filteredSubscriptions.length; i += batchSize) {
    const batch = filteredSubscriptions.slice(i, i + batchSize);
    
    const results = await Promise.allSettled(
      batch.map(async (subscription) => {
        const result = await sendPushNotification(
          {
            endpoint: subscription.endpoint,
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
          payload
        );

        if (result.success) {
          sent++;
          await logNotification({
            user_id: subscription.user_id,
            notification_type: notificationType,
            title: payload.title,
            body: payload.body,
            url: payload.url,
            status: 'sent',
            metadata,
          });
        } else {
          failed++;
          await logNotification({
            user_id: subscription.user_id,
            notification_type: notificationType,
            title: payload.title,
            body: payload.body,
            url: payload.url,
            status: 'failed',
            error_message: result.error,
            metadata,
          });

          if (result.error === 'Subscription expired') {
            await supabaseAdmin
              .from('user_push_subscriptions')
              .update({ is_active: false })
              .eq('id', subscription.id);
          }
        }
      })
    );
  }

  return { sent, failed };
}

/**
 * Send notification to a cohort (or multiple cohorts)
 */
export async function sendToCohort(
  cohortIdentifiers: string[],
  payload: NotificationPayload,
  notificationType: NotificationType,
  metadata?: Record<string, any>
): Promise<{ sent: number; failed: number }> {
  if (!cohortIdentifiers || cohortIdentifiers.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Get user IDs for cohorts
  const userIds = await getUsersByCohorts(cohortIdentifiers);

  if (userIds.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Send to all users in cohorts
  return sendToMultipleUsers(userIds, payload, notificationType, metadata);
}

/**
 * Log notification to database
 */
async function logNotification(log: Partial<NotificationLog>): Promise<void> {
  try {
    await supabaseAdmin.from('notification_logs').insert({
      user_id: log.user_id,
      notification_type: log.notification_type,
      title: log.title,
      body: log.body,
      url: log.url,
      status: log.status || 'sent',
      error_message: log.error_message,
      metadata: log.metadata,
    });
  } catch (error) {
    console.error('Error logging notification:', error);
    // Don't throw - logging failures shouldn't break notification sending
  }
}

/**
 * Format event date and time for notification body
 */
export function formatEventDateTime(date: string, startTime?: string | null): string {
  const eventDate = new Date(date);
  const dateStr = eventDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (startTime) {
    const timeStr = startTime.slice(0, 5); // Format as HH:MM
    return `${dateStr} at ${timeStr}`;
  }

  return dateStr;
}

