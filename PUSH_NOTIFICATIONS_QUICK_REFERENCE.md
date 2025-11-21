# Push Notifications Quick Reference

## 📱 All Implemented Push Notifications

### 1. Event Notifications (4 types)

| Notification Type | Trigger | Recipients | When |
|------------------|---------|------------|------|
| **Event Reminder (1h)** | Scheduled cron task | All users in `target_cohorts` | 1 hour before event start |
| **Event Reminder (15m)** | Scheduled cron task | All users in `target_cohorts` | 15 minutes before event start |
| **Event Update** | Event status changed | All users in `target_cohorts` | When status → `postponed`, `rescheduled`, or `moved-online` |
| **Event Cancellation** | Event status changed | All users in `target_cohorts` | When status → `cancelled` |

**Requirements:**
- Event must have `target_cohorts` set (e.g., `["ARU Year 4", "UCL Year 6"]`)
- Users must match cohort (have `university` and `study_year` matching)
- Users with NULL `university` or `study_year` are excluded

---

### 2. Booking Notifications (5 types)

| Notification Type | Trigger | Recipients | When |
|------------------|---------|------------|------|
| **Booking Reminder (24h)** | Scheduled cron task | Users with confirmed bookings | 24 hours before event start |
| **Booking Reminder (1h)** | Scheduled cron task | Users with confirmed bookings | 1 hour before event start |
| **Booking Reminder (Start)** | Scheduled cron task | Users with confirmed bookings | When event starts |
| **Waitlist Promotion** | Booking status changed | User promoted from waitlist | When `waitlist` → `confirmed` |
| **Admin Cancellation** | Admin cancels booking | User whose booking was cancelled | When admin sets status → `cancelled` |

**Requirements:**
- Booking must be in `confirmed` status for reminders
- User must have push notifications enabled

---

### 3. Certificate Notifications (1 type)

| Notification Type | Trigger | Recipients | When |
|------------------|---------|------------|------|
| **Certificate Available** | Certificate generated | User who received certificate | Immediately after certificate generation |

**Requirements:**
- Certificate must be successfully generated
- User must have push notifications enabled

---

### 4. Feedback Notifications (2 types)

| Notification Type | Trigger | Recipients | When |
|------------------|---------|------------|------|
| **Feedback Request (Immediate)** | Event ends | All users who booked/attended | Immediately when event ends |
| **Feedback Request (Next Day)** | Scheduled cron task | All users who booked/attended | 24 hours after event ends |

**Requirements:**
- Event must have `booking_enabled` and `feedback_enabled` = true
- User must have booked or attended the event

---

## 🧪 Quick Test Commands

### Test Event Reminders
```bash
# Manually trigger event reminders cron job
POST /api/jobs/event-reminders
```

### Test Booking Reminders
```bash
# Manually trigger booking reminders cron job
POST /api/jobs/booking-reminders
```

### Test Feedback Invites
```bash
# Manually trigger feedback invites cron job
POST /api/jobs/feedback-invites
```

---

## 📊 Notification Types Reference

These are the `notification_type` values stored in `notification_logs`:

- `event_reminder_1h`
- `event_reminder_15m`
- `event_update`
- `event_cancellation`
- `booking_reminder_24h`
- `booking_reminder_1h`
- `booking_reminder_start`
- `booking_waitlist_promoted`
- `booking_admin_cancelled`
- `certificate_available`
- `feedback_request`
- `announcement` (for future use)

---

## 🔍 Database Queries for Testing

### Check if notifications were sent:
```sql
SELECT 
  notification_type,
  title,
  status,
  sent_at,
  delivered_at,
  opened_at
FROM notification_logs
WHERE user_id = 'YOUR_USER_ID'
ORDER BY sent_at DESC;
```

### Check scheduled reminders:
```sql
SELECT 
  task_type,
  event_id,
  status,
  run_at
FROM cron_tasks
WHERE task_type LIKE '%reminder%'
  AND status = 'pending'
ORDER BY run_at ASC;
```

### Check user subscriptions:
```sql
SELECT 
  u.email,
  COUNT(ups.id) as subscription_count
FROM users u
LEFT JOIN user_push_subscriptions ups ON u.id = ups.user_id
GROUP BY u.id, u.email;
```

---

## ✅ Testing Checklist

### Setup
- [ ] VAPID keys configured in Vercel
- [ ] Database migration run
- [ ] User enabled push notifications in profile
- [ ] Browser granted notification permission

### Event Notifications
- [ ] Create event with `target_cohorts`
- [ ] Verify reminders scheduled in `cron_tasks`
- [ ] Test event status update → notification sent
- [ ] Test event cancellation → notification sent

### Booking Notifications
- [ ] Book event → verify reminders scheduled
- [ ] Test waitlist promotion → notification sent
- [ ] Test admin cancellation → notification sent

### Certificate Notifications
- [ ] Generate certificate → notification sent

### Feedback Notifications
- [ ] Event ends → immediate notification sent
- [ ] Next day → reminder notification sent

---

## 🎯 Key Points

1. **Cohort Targeting**: Events must have `target_cohorts` set. Format: `["ARU Year 4", "UCL Year 6"]`
2. **User Matching**: Users must have matching `university` and `study_year` (NULL values excluded)
3. **Preferences**: Users can disable specific notification types in their profile
4. **Cron Jobs**: Run every 15 minutes. For immediate testing, manually trigger endpoints
5. **Logging**: All notifications are logged in `notification_logs` table

