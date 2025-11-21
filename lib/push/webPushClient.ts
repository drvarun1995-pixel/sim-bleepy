/**
 * Web Push API client wrapper
 * Handles VAPID authentication and payload formatting
 */

import webpush from 'web-push';
import { NotificationPayload } from './types';

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@bleepy.co.uk';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn('VAPID keys not configured. Push notifications will not work.');
} else {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Format notification payload for web-push
 */
export function formatNotificationPayload(payload: NotificationPayload): string {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/logo.png',
    image: payload.image,
    url: payload.url,
    data: payload.data || {},
  });
}

/**
 * Send push notification to a subscription
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      success: false,
      error: 'VAPID keys not configured',
    };
  }

  try {
    const formattedPayload = formatNotificationPayload(payload);
    
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      formattedPayload
    );

    return { success: true };
  } catch (error: any) {
    // Handle specific web-push errors
    if (error.statusCode === 410) {
      // Subscription expired or invalid
      return {
        success: false,
        error: 'Subscription expired',
      };
    } else if (error.statusCode === 429) {
      // Too many requests
      return {
        success: false,
        error: 'Rate limited',
      };
    } else {
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}

