/**
 * Cohort filtering utilities for push notifications
 * Matches users by university + study_year combination
 */

import { supabaseAdmin } from '@/utils/supabase';

export interface CohortIdentifier {
  university: string;
  year: string;
}

/**
 * Parse cohort identifier string (e.g., "ARU Year 4") into parts
 */
export function parseCohortIdentifier(identifier: string): CohortIdentifier | null {
  // Format: "ARU Year 4" or "UCL Year 6" or "Foundation Year 1"
  const parts = identifier.trim().split(/\s+/);
  
  if (parts.length < 3) {
    // Try format like "ARU-4" or "UCL-6"
    const dashParts = identifier.split('-');
    if (dashParts.length === 2) {
      return {
        university: dashParts[0].trim(),
        year: dashParts[1].trim(),
      };
    }
    return null;
  }
  
  // Handle "Foundation Year 1" format
  if (parts[0] === 'Foundation' && parts[1] === 'Year') {
    return {
      university: 'Foundation',
      year: parts[2],
    };
  }
  
  // Handle "ARU Year 4" format
  if (parts[1] === 'Year') {
    return {
      university: parts[0],
      year: parts[2],
    };
  }
  
  return null;
}

/**
 * Get user IDs matching a cohort identifier
 * Only includes users with both university and study_year set (not NULL)
 */
export async function getUsersByCohort(cohortIdentifier: string): Promise<string[]> {
  const parsed = parseCohortIdentifier(cohortIdentifier);
  
  if (!parsed) {
    console.warn(`Invalid cohort identifier format: ${cohortIdentifier}`);
    return [];
  }
  
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('university', parsed.university)
    .eq('study_year', parsed.year)
    .not('university', 'is', null)
    .not('study_year', 'is', null);
  
  if (error) {
    console.error('Error fetching users by cohort:', error);
    return [];
  }
  
  return users?.map(u => u.id) || [];
}

/**
 * Get user IDs matching multiple cohort identifiers
 */
export async function getUsersByCohorts(cohortIdentifiers: string[]): Promise<string[]> {
  if (!cohortIdentifiers || cohortIdentifiers.length === 0) {
    return [];
  }
  
  const allUserIds = new Set<string>();
  
  for (const identifier of cohortIdentifiers) {
    const userIds = await getUsersByCohort(identifier);
    userIds.forEach(id => allUserIds.add(id));
  }
  
  return Array.from(allUserIds);
}

/**
 * Get active push subscriptions for user IDs
 */
export async function getSubscriptionsForUsers(userIds: string[]): Promise<any[]> {
  if (!userIds || userIds.length === 0) {
    return [];
  }
  
  const { data: subscriptions, error } = await supabaseAdmin
    .from('user_push_subscriptions')
    .select('*')
    .in('user_id', userIds)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
  
  return subscriptions || [];
}

/**
 * Filter subscriptions by user notification preferences
 */
export async function filterSubscriptionsByPreferences(
  subscriptions: any[],
  notificationType: string
): Promise<any[]> {
  if (subscriptions.length === 0) {
    return [];
  }
  
  // Map notification types to preference fields
  const preferenceMap: Record<string, keyof any> = {
    event_reminder_1h: 'teaching_events',
    event_reminder_15m: 'teaching_events',
    event_update: 'teaching_events',
    event_cancellation: 'teaching_events',
    booking_reminder_24h: 'bookings',
    booking_reminder_1h: 'bookings',
    booking_reminder_start: 'bookings',
    booking_waitlist_promoted: 'bookings',
    booking_admin_cancelled: 'bookings',
    certificate_available: 'certificates',
    feedback_request: 'feedback',
    announcement: 'announcements',
  };
  
  const preferenceField = preferenceMap[notificationType];
  if (!preferenceField) {
    // If no preference mapping, allow all
    return subscriptions;
  }
  
  const userIds = subscriptions.map(s => s.user_id);
  
  // Fetch preferences for all users
  const selectFields = `user_id, ${preferenceField}`;
  const { data: preferences, error } = await supabaseAdmin
    .from('user_notification_preferences')
    .select(selectFields)
    .in('user_id', userIds);
  
  if (error) {
    console.error('Error fetching preferences:', error);
    // If error, allow all (fail open)
    return subscriptions;
  }
  
  // Create a map of user_id -> preference value
  const preferenceMapByUser = new Map<string, boolean>();
  preferences?.forEach(pref => {
    preferenceMapByUser.set(pref.user_id, pref[preferenceField] ?? true);
  });
  
  // Filter subscriptions where preference is enabled
  return subscriptions.filter(sub => {
    const preference = preferenceMapByUser.get(sub.user_id);
    // Default to true if no preference record exists
    return preference !== false;
  });
}

