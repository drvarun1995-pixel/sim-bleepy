# Push Notifications Testing Guide

This guide explains all the push notifications that have been implemented and how to test each one.

## 📋 Overview of Implemented Notifications

### 1. **Event Notifications**
- Event reminders (1 hour before)
- Event reminders (15 minutes before)
- Event updates (when status changes to postponed/rescheduled/moved-online)
- Event cancellations

### 2. **Booking Notifications**
- Booking reminders (24 hours before)
- Booking reminders (1 hour before)
- Booking reminders (when event starts)
- Waitlist promotion (when moved from waitlist to confirmed)
- Admin cancellation (when admin cancels a booking)

### 3. **Certificate Notifications**
- Certificate available (when certificate is generated)

### 4. **Feedback Notifications**
- Feedback request (immediate - when event ends)
- Feedback request (next day reminder - 24 hours after event ends)

### 5. **Announcement Notifications**
- Announcement push (when admins send announcements with push enabled)

---

## 🧪 Testing Instructions

### Prerequisites

1. **Enable Push Notifications:**
   - Go to your profile page (`/dashboard/[role]/profile`)
   - Scroll to "Push Notifications" section
   - Click "Enable Push Notifications"
   - Grant browser permission when prompted
   - Ensure all notification categories are enabled

2. **Set Up Test User:**
   - Create a test user with:
     - `university`: "ARU" (or "UCL")
     - `study_year`: 4 (or any year)
   - This is needed for cohort-based event notifications

3. **Verify Environment Variables:**
   - Ensure VAPID keys are set in Vercel:
     - `VAPID_PUBLIC_KEY`
     - `VAPID_PRIVATE_KEY`
     - `VAPID_SUBJECT`
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

---

## 📅 Testing Event Notifications

### Test 1: Event Reminders (1 hour and 15 minutes before)

**Steps:**
1. Create a new event with:
   - Date: Set to tomorrow (or a future date)
   - Start time: Set to 1 hour and 15 minutes from now (for quick testing)
   - `target_cohorts`: `["ARU Year 4"]` (or match your test user's cohort)
   - Booking enabled: Yes
   - Feedback enabled: Yes

2. **For immediate testing (if event is less than 1 hour away):**
   - The cron job runs every 15 minutes
   - Manually trigger: Go to `/api/jobs/event-reminders` (POST request)
   - Or wait for the scheduled cron job

3. **Expected Result:**
   - You should receive 2 push notifications:
     - One 1 hour before the event
     - One 15 minutes before the event
   - Notifications should only go to users matching the `target_cohorts`

**Manual Trigger (for testing):**
```bash
# Using curl or Postman
POST https://your-domain.com/api/jobs/event-reminders
# Or locally:
POST http://localhost:3000/api/jobs/event-reminders
```

### Test 2: Event Status Updates

**Steps:**
1. Create or edit an event with `target_cohorts: ["ARU Year 4"]`
2. Update the event status to one of:
   - `postponed`
   - `rescheduled`
   - `moved-online`
3. Save the event

**Expected Result:**
- Push notification sent immediately to all users in the target cohort
- Notification title: "Event Updated: [Event Title]"
- Includes event details and deep link

### Test 3: Event Cancellation

**Steps:**
1. Create or edit an event with `target_cohorts: ["ARU Year 4"]`
2. Update the event status to `cancelled`
3. Save the event

**Expected Result:**
- Push notification sent immediately to all users in the target cohort
- Notification title: "Event Cancelled: [Event Title]"
- Includes cancellation details and deep link

---

## 🎫 Testing Booking Notifications

### Test 4: Booking Reminders (24h, 1h, and Start)

**Steps:**
1. Create an event with:
   - Date: Tomorrow (or future date)
   - Start time: Set appropriately
   - Booking enabled: Yes

2. Book the event as a test user (status should be `confirmed`)

3. **For immediate testing:**
   - Manually trigger: Go to `/api/jobs/booking-reminders` (POST request)
   - Or wait for the scheduled cron job (runs every 15 minutes)

4. **Expected Result:**
   - You should receive 3 push notifications:
     - One 24 hours before the event
     - One 1 hour before the event
     - One when the event starts
   - Only sent to users who have confirmed bookings

**Manual Trigger:**
```bash
POST https://your-domain.com/api/jobs/booking-reminders
```

### Test 5: Waitlist Promotion

**Steps:**
1. Create an event with:
   - Booking enabled: Yes
   - Booking capacity: 1 (to force waitlist)
   - Allow waitlist: Yes

2. Book the event as User A (gets confirmed)

3. Book the event as User B (gets waitlisted)

4. Cancel User A's booking (as admin or User A)

5. **Expected Result:**
   - User B should receive a push notification immediately
   - Notification title: "You're In! Waitlist Promotion"
   - Includes event details (date, time, location)
   - User B's booking status changes to `confirmed`

### Test 6: Admin Cancellation

**Steps:**
1. Create an event and book it as a test user

2. As an admin, go to the booking management page

3. Cancel the booking (change status to `cancelled`)

4. **Expected Result:**
   - Test user receives push notification immediately
   - Notification title: "Booking Cancelled: [Event Title]"
   - Includes cancellation details

---

## 🏆 Testing Certificate Notifications

### Test 7: Certificate Available

**Steps:**
1. Create an event with:
   - Booking enabled: Yes
   - Auto-generate certificate: Yes (or manually generate later)

2. Book and attend the event (or mark as attended)

3. Generate certificates for the event:
   - Go to `/certificates/generate`
   - Select the event
   - Generate certificates

4. **Expected Result:**
   - Each user who received a certificate gets a push notification immediately
   - Notification title: "Certificate Available: [Event Title]"
   - Includes download link in the notification

---

## 💬 Testing Feedback Notifications

### Test 8: Feedback Request (Immediate)

**Steps:**
1. Create an event with:
   - Date: Set to yesterday (or past date)
   - End time: Set to a time in the past
   - Booking enabled: Yes
   - Feedback enabled: Yes

2. Ensure users have booked/attended the event

3. **For immediate testing:**
   - Manually trigger: Go to `/api/jobs/feedback-invites` (POST request)
   - Or wait for the scheduled cron job

4. **Expected Result:**
   - All event participants receive a push notification immediately
   - Notification title: "Feedback Request: [Event Title]"
   - Includes link to feedback form

**Manual Trigger:**
```bash
POST https://your-domain.com/api/jobs/feedback-invites
```

### Test 9: Feedback Request (Next Day Reminder)

**Steps:**
1. The system automatically creates a "next day" task when an event ends
2. This task runs 24 hours after the event end time
3. **For immediate testing:**
   - Manually update the `run_at` time in the `cron_tasks` table to a past time
   - Then trigger `/api/jobs/feedback-invites`

4. **Expected Result:**
   - All event participants receive a second push notification
   - Same content as immediate notification
   - Sent 24 hours after the event ended

---

## 📢 Testing Announcement Notifications

### Test 10: Announcement Push

**Steps:**
1. As an admin, go to announcements page

2. Create a new announcement with:
   - Target audience: All users or specific cohorts
   - Enable push notification (if this feature is implemented in the UI)

3. **Note:** Announcement push notifications need to be integrated into the announcement creation API. Currently, the infrastructure is ready but may need to be connected to the announcement creation flow.

4. **Expected Result:**
   - All targeted users receive a push notification
   - Notification includes announcement title and content
   - Deep link to the announcement

---

## 🔍 Debugging & Verification

### Check Notification Logs

All notifications are logged in the `notification_logs` table:

```sql
-- View recent notifications
SELECT 
  id,
  user_id,
  notification_type,
  title,
  status,
  sent_at,
  delivered_at,
  opened_at
FROM notification_logs
ORDER BY sent_at DESC
LIMIT 50;
```

### Check User Subscriptions

```sql
-- View user push subscriptions
SELECT 
  u.email,
  ups.endpoint,
  ups.created_at
FROM user_push_subscriptions ups
JOIN users u ON u.id = ups.user_id
ORDER BY ups.created_at DESC;
```

### Check User Preferences

```sql
-- View notification preferences
SELECT 
  u.email,
  unp.events,
  unp.bookings,
  unp.certificates,
  unp.feedback,
  unp.announcements
FROM user_notification_preferences unp
JOIN users u ON u.id = unp.user_id;
```

### Check Cron Tasks

```sql
-- View scheduled notification tasks
SELECT 
  task_type,
  event_id,
  user_id,
  status,
  run_at,
  processed_at
FROM cron_tasks
WHERE task_type LIKE '%push%' OR task_type LIKE '%reminder%'
ORDER BY run_at DESC
LIMIT 50;
```

---

## 🐛 Common Issues & Solutions

### Issue: No notifications received

**Solutions:**
1. Check browser console for errors
2. Verify service worker is registered: `navigator.serviceWorker.getRegistrations()`
3. Check notification permissions: `Notification.permission`
4. Verify VAPID keys are set correctly
5. Check notification logs in database
6. Ensure user has enabled push notifications in profile

### Issue: Notifications not scheduled

**Solutions:**
1. Verify `target_cohorts` is set on events (for event notifications)
2. Check cron tasks table for scheduled tasks
3. Verify cron job endpoints are accessible
4. Check Vercel cron configuration in `vercel.json`

### Issue: Wrong users receiving notifications

**Solutions:**
1. Verify cohort matching logic:
   - User's `university` and `study_year` must match event's `target_cohorts`
   - Users with NULL `university` or `study_year` are excluded
2. Check user notification preferences
3. Verify subscription is active

### Issue: Notifications delayed

**Solutions:**
1. Cron jobs run every 15 minutes
2. For immediate testing, manually trigger the cron endpoints
3. Check `run_at` time in `cron_tasks` table

---

## 📝 Quick Test Checklist

- [ ] User can enable push notifications in profile
- [ ] Service worker is registered
- [ ] Event reminders are scheduled when event is created
- [ ] Event reminders are sent at correct times
- [ ] Event status updates trigger notifications
- [ ] Event cancellations trigger notifications
- [ ] Booking reminders are scheduled when booking is confirmed
- [ ] Booking reminders are sent at correct times
- [ ] Waitlist promotion sends notification
- [ ] Admin cancellation sends notification
- [ ] Certificate generation sends notification
- [ ] Feedback requests are sent (immediate and next day)
- [ ] Notifications respect user preferences
- [ ] Cohort filtering works correctly
- [ ] Deep links work in notifications

---

## 🚀 Production Testing

Before going live, test with:
1. Multiple browsers (Chrome, Firefox, Edge, Safari)
2. Multiple devices (desktop, mobile)
3. Different user roles (student, admin, etc.)
4. Various cohort combinations
5. Edge cases (no target_cohorts, NULL values, etc.)

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check server logs in Vercel
3. Review notification logs in database
4. Verify all environment variables are set
5. Ensure database migrations have been run

