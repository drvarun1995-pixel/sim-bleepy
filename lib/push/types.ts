/**
 * Type definitions for Web Push Notifications
 */

export interface PushSubscription {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_info?: {
    browser?: string;
    os?: string;
    userAgent?: string;
  };
  subscribed_at?: string;
  last_active_at?: string;
  is_active?: boolean;
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  teaching_events: boolean;
  bookings: boolean;
  certificates: boolean;
  feedback: boolean;
  announcements: boolean;
  leaderboard_updates: boolean;
  quiz_reminders: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url: string;
  data?: {
    type: string;
    id: string;
    [key: string]: any;
  };
}

export interface NotificationLog {
  id?: string;
  user_id?: string;
  notification_type: string;
  title: string;
  body?: string;
  url?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  error_message?: string;
  metadata?: Record<string, any>;
}

export type NotificationType =
  | 'event_reminder_1h'
  | 'event_reminder_15m'
  | 'event_update'
  | 'event_cancellation'
  | 'booking_reminder_24h'
  | 'booking_reminder_1h'
  | 'booking_reminder_start'
  | 'booking_waitlist_promoted'
  | 'booking_admin_cancelled'
  | 'certificate_available'
  | 'feedback_request'
  | 'announcement';

