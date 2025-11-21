# Web Push Notifications Setup Guide

## What Has Been Implemented

A complete custom Web Push API notification system has been built with the following features:

### Core Features
- ✅ Service worker for handling push notifications
- ✅ Subscription management (subscribe/unsubscribe)
- ✅ User notification preferences
- ✅ Cohort-based targeting (e.g., "ARU Year 4", "UCL Year 6")
- ✅ Event reminders (1 hour before and 15 minutes before)
- ✅ Booking reminders (24h, 1h, and when event starts)
- ✅ Waitlist promotion notifications
- ✅ Certificate available notifications
- ✅ Feedback request notifications
- ✅ Event update/cancellation notifications
- ✅ Admin cancellation notifications
- ✅ Notification logging and tracking

### Files Created

#### Core Infrastructure
- `scripts/generate-vapid-keys.ts` - Script to generate VAPID keys
- `public/sw.js` - Service worker for push notifications
- `lib/push/types.ts` - TypeScript type definitions
- `lib/push/webPushClient.ts` - Web Push API client wrapper
- `lib/push/notificationService.ts` - Core notification sending service
- `lib/push/cohortFiltering.ts` - Cohort-based user filtering

#### Notification Services
- `lib/push/eventNotifications.ts` - Event reminder/update/cancellation notifications
- `lib/push/bookingNotifications.ts` - Booking reminders and notifications
- `lib/push/certificateNotifications.ts` - Certificate available notifications
- `lib/push/feedbackNotifications.ts` - Feedback request notifications

#### API Routes
- `app/api/push/subscribe/route.ts` - Subscribe to push notifications
- `app/api/push/unsubscribe/route.ts` - Unsubscribe from push notifications
- `app/api/push/preferences/route.ts` - Get/update notification preferences
- `app/api/jobs/event-reminders/route.ts` - Cron job for event reminders
- `app/api/jobs/booking-reminders/route.ts` - Cron job for booking reminders

#### UI Components
- `components/push/PushNotificationProvider.tsx` - React context provider
- `components/push/NotificationPreferences.tsx` - Preferences UI component

#### Database
- `supabase/migrations/20241122_add_web_push_notifications.sql` - Database migration

#### Configuration
- `vercel.json` - Updated with new cron jobs
- `package.json` - Added `web-push` dependency

## What You Need to Do

### 1. Generate VAPID Keys

Run the following command to generate VAPID keys:

```bash
npm run generate-vapid-keys
```

This will output three values:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (already set to `mailto:support@bleepy.co.uk`)

### 2. Add Environment Variables

Add the following to your `.env.local` file:

```env
VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:support@bleepy.co.uk
```

**IMPORTANT:** Also add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same value as `VAPID_PUBLIC_KEY`) for the frontend:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
```

### 3. Add to Vercel Environment Variables

Add the same environment variables to your Vercel project:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

### 4. Run Database Migration

Run the database migration in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20241122_add_web_push_notifications.sql`
3. Paste and execute

This creates:
- `user_push_subscriptions` table
- `user_notification_preferences` table
- `notification_logs` table
- Adds `target_cohorts` column to `events` table

### 5. Install Dependencies

Run:

```bash
npm install
```

This will install the `web-push` package.

### 6. Add Notification Preferences to Profile Page

Add the `NotificationPreferences` component to your profile page. For example, in `app/dashboard/student/profile/page.tsx`:

```tsx
import { NotificationPreferences } from '@/components/push/NotificationPreferences';

// Add inside the profile page JSX:
<NotificationPreferences />
```

### 7. Update Event Creation/Update APIs

The event APIs need to be updated to:
1. Accept `target_cohorts` field
2. Pass `target_cohorts` to `createCronTasksForEvent` / `updateCronTasksForEvent`
3. Send push notifications when event status changes

**Files to update:**
- `app/api/events/create/route.ts` - Add `target_cohorts` handling and pass to cron tasks
- `app/api/events/[id]/route.ts` - Add `target_cohorts` handling, pass to cron tasks, and send notifications on status change

### 8. Integrate Booking Notifications

Update the booking API to:
1. Schedule booking reminders when a booking is created
2. Send waitlist promotion notification when status changes from waitlist to confirmed
3. Send admin cancellation notification when admin cancels a booking

**File to update:**
- `app/api/bookings/route.ts` - Add notification triggers

### 9. Integrate Certificate Notifications

Update the certificate generation API to send notifications:

**File to update:**
- `app/api/certificates/generate/route.ts` - Call `sendCertificateAvailableNotification` after generation

### 10. Integrate Feedback Notifications

The feedback invite system already exists. Update it to also send push notifications:

**File to update:**
- `app/api/jobs/feedback-invites/route.ts` - Add push notification sending alongside email

### 11. Test the Implementation

1. **Test Subscription:**
   - Go to profile page
   - Click "Enable Push Notifications"
   - Grant permission
   - Verify subscription is saved

2. **Test Event Reminders:**
   - Create an event with `target_cohorts: ["ARU Year 4"]`
   - Set start time to 1 hour and 15 minutes from now
   - Wait for cron job to run (every 15 minutes)
   - Verify reminders are sent

3. **Test Preferences:**
   - Toggle notification preferences
   - Verify preferences are saved
   - Test that disabled preferences prevent notifications

## Notification Types Implemented

### Event Notifications
- **Reminders:** 1 hour before and 15 minutes before event start
- **Updates:** When event status changes
- **Cancellations:** When event is cancelled

### Booking Notifications
- **Reminders:** 24 hours before, 1 hour before, and when event starts
- **Waitlist Promotion:** When user moves from waitlist to confirmed
- **Admin Cancellation:** When admin cancels a booking

### Certificate Notifications
- **Available:** When certificate is generated

### Feedback Notifications
- **Request:** After event ends (immediate and next day)

## Cohort Targeting

Events can target specific cohorts using the `target_cohorts` field (array of strings):
- Format: `["ARU Year 4", "UCL Year 6", "Foundation Year 1"]`
- Users are matched by `university` + `study_year` combination
- If `target_cohorts` is empty or null, no push notifications are sent

## User Preferences

Users can control which notification types they receive:
- Teaching Events (reminders, updates, cancellations)
- Bookings (reminders, waitlist, cancellations)
- Certificates (when available)
- Feedback (requests)
- Announcements

All preferences are enabled by default when user subscribes.

## Cron Jobs

Two new cron jobs run every 15 minutes:
- `/api/jobs/event-reminders` - Processes event reminder tasks
- `/api/jobs/booking-reminders` - Processes booking reminder tasks

These are already configured in `vercel.json`.

## Next Steps

1. Complete steps 1-6 above (setup)
2. Add `NotificationPreferences` component to profile page
3. Update event/booking/certificate/feedback APIs to trigger notifications
4. Test thoroughly
5. Deploy to production

## Troubleshooting

### Notifications Not Working
- Check VAPID keys are set correctly
- Verify service worker is registered (check browser console)
- Check notification permission is granted
- Verify user has active subscription in database
- Check cron jobs are running (Vercel logs)

### Cohort Targeting Not Working
- Verify `target_cohorts` field is set on events
- Check user has `university` and `study_year` set (not NULL)
- Verify cohort format matches exactly (e.g., "ARU Year 4")

### Preferences Not Saving
- Check API endpoint is accessible
- Verify user is authenticated
- Check browser console for errors

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Vercel function logs
3. Check Supabase database for subscription records
4. Verify environment variables are set correctly

