# OneSignal Push Notifications Implementation Plan
## For sim-bleepy Medical Education Platform

**Version:** 1.0  
**Date:** November 2024  
**Author:** Implementation Plan

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Database Schema](#database-schema)
5. [Notification Types](#notification-types)
6. [Segmentation Strategy](#segmentation-strategy)
7. [API Routes](#api-routes)
8. [Frontend Components](#frontend-components)
9. [Backend Services](#backend-services)
10. [Implementation Steps](#implementation-steps)
11. [Testing Strategy](#testing-strategy)
12. [Security Considerations](#security-considerations)
13. [Monitoring & Analytics](#monitoring--analytics)

---

## Overview

### Objectives
- Implement personalized push notifications for teaching events based on user cohorts (e.g., ARU Year 4)
- Send notifications for bookings, certificates, feedback, and other relevant activities
- Maintain user privacy and provide opt-in/opt-out functionality
- Ensure notifications are relevant and timely

### Scope
- OneSignal integration for web push notifications
- User subscription management
- Event-based notification triggers
- Cohort-based segmentation
- Notification preferences management

---

## Architecture

### High-Level Flow

```
User Browser
    ↓
[OneSignal SDK] → Subscribe → [OneSignal Dashboard]
    ↓
[Next.js API] → Store Subscription → [Supabase Database]
    ↓
[Event Triggers] → [Notification Service] → [OneSignal API] → [User Device]
```

### Components

1. **Frontend (Next.js)**
   - OneSignal SDK integration
   - Subscription UI component
   - Notification permission handler
   - Preferences management UI

2. **Backend (Next.js API Routes)**
   - Subscription management endpoints
   - Notification sending service
   - Event trigger handlers

3. **Database (Supabase)**
   - User push subscriptions table
   - Notification preferences table
   - Event-to-cohort mapping

4. **OneSignal**
   - Push notification delivery
   - Segmentation management
   - Analytics dashboard

---

## Setup & Configuration

### 1. OneSignal Account Setup

#### Steps:
1. Create OneSignal account at https://onesignal.com
2. Create new Web Push app
3. Configure website URL: `https://sim.bleepy.co.uk`
4. Download/note the following:
   - **App ID** (OneSignal App ID)
   - **REST API Key** (for server-side sending)
   - **Safari Web ID** (if needed for Safari)

#### Environment Variables:
```env
NEXT_PUBLIC_ONESIGNAL_APP_ID=your-app-id-here
ONESIGNAL_REST_API_KEY=your-rest-api-key-here
ONESIGNAL_USER_AUTH_KEY=your-user-auth-key-here (optional, for API management)
```

### 2. OneSignal Dashboard Configuration

#### Segments to Create:
- `ARU Year 4`
- `ARU Year 3`
- `ARU Year 5`
- `All Users`
- `Admins`
- `MedEd Team`
- `Students`

#### Notification Templates:
- Teaching Event Reminder
- Booking Confirmation
- Booking Reminder
- Certificate Available
- Feedback Request
- Event Cancellation
- Event Update

---

## Database Schema

### 1. Push Subscriptions Table

```sql
-- Table: user_push_subscriptions
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  onesignal_player_id TEXT NOT NULL UNIQUE,
  subscription_endpoint TEXT,
  subscription_keys JSONB,
  device_info JSONB, -- browser, OS, etc.
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_push_subscriptions_user_id ON user_push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_player_id ON user_push_subscriptions(onesignal_player_id);
CREATE INDEX idx_push_subscriptions_active ON user_push_subscriptions(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON user_push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON user_push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON user_push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON user_push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
```

### 2. Notification Preferences Table

```sql
-- Table: user_notification_preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  teaching_events BOOLEAN DEFAULT TRUE,
  bookings BOOLEAN DEFAULT TRUE,
  certificates BOOLEAN DEFAULT TRUE,
  feedback BOOLEAN DEFAULT TRUE,
  announcements BOOLEAN DEFAULT TRUE,
  leaderboard_updates BOOLEAN DEFAULT FALSE,
  quiz_reminders BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_prefs_user_id ON user_notification_preferences(user_id);

-- RLS Policies
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON user_notification_preferences FOR ALL
  USING (auth.uid() = user_id);
```

### 3. Notification Log Table (Optional - for tracking)

```sql
-- Table: notification_logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  notification_title TEXT NOT NULL,
  notification_body TEXT,
  onesignal_notification_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent', -- sent, delivered, opened, failed
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
```

### 4. Event-Cohort Mapping (if not exists)

```sql
-- Ensure events table has cohort relationship
-- This should already exist, but verify:
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id);
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS target_cohorts TEXT[]; -- Array of cohort names
```

---

## Notification Types

### 1. Teaching Events

#### Event Reminder (24 hours before)
- **Trigger:** 24 hours before event start time
- **Segmentation:** Event's target cohort(s)
- **Content:**
  - Title: "Reminder: [Event Title]"
  - Body: "[Event Title] starts tomorrow at [Time]. Don't forget to attend!"
  - Action: Link to event page

#### Event Reminder (1 hour before)
- **Trigger:** 1 hour before event start time
- **Segmentation:** Event's target cohort(s)
- **Content:**
  - Title: "Starting Soon: [Event Title]"
  - Body: "[Event Title] starts in 1 hour at [Time]."
  - Action: Link to event page

#### Event Cancellation
- **Trigger:** When event is cancelled
- **Segmentation:** Event's target cohort(s)
- **Content:**
  - Title: "Event Cancelled: [Event Title]"
  - Body: "The event '[Event Title]' scheduled for [Date/Time] has been cancelled."
  - Action: Link to events page

#### Event Update
- **Trigger:** When event details change
- **Segmentation:** Event's target cohort(s)
- **Content:**
  - Title: "Event Updated: [Event Title]"
  - Body: "The event '[Event Title]' has been updated. Check the new details."
  - Action: Link to event page

### 2. Bookings

#### Booking Confirmation
- **Trigger:** When user books a session/event
- **Segmentation:** Individual user
- **Content:**
  - Title: "Booking Confirmed"
  - Body: "Your booking for [Event/Session Name] on [Date] at [Time] has been confirmed."
  - Action: Link to booking details

#### Booking Reminder
- **Trigger:** 1 day before booked session
- **Segmentation:** Individual user
- **Content:**
  - Title: "Reminder: Your Booking Tomorrow"
  - Body: "You have a booking for [Event/Session Name] tomorrow at [Time]."
  - Action: Link to booking details

#### Booking Cancellation
- **Trigger:** When booking is cancelled
- **Segmentation:** Individual user
- **Content:**
  - Title: "Booking Cancelled"
  - Body: "Your booking for [Event/Session Name] has been cancelled."
  - Action: Link to bookings page

### 3. Certificates

#### Certificate Available
- **Trigger:** When certificate is issued/available
- **Segmentation:** Individual user
- **Content:**
  - Title: "Certificate Available"
  - Body: "Your certificate for [Course/Event Name] is now available for download."
  - Action: Link to certificates page

### 4. Feedback

#### Feedback Request
- **Trigger:** After event/session completion
- **Segmentation:** Event participants
- **Content:**
  - Title: "Share Your Feedback"
  - Body: "We'd love to hear your thoughts on [Event Name]. Please share your feedback."
  - Action: Link to feedback form

#### Feedback Response Thank You
- **Trigger:** After user submits feedback
- **Segmentation:** Individual user
- **Content:**
  - Title: "Thank You for Your Feedback"
  - Body: "Thank you for taking the time to provide feedback. Your input helps us improve."
  - Action: None (just acknowledgment)

### 5. Other Notifications

#### Announcements
- **Trigger:** When admin creates announcement
- **Segmentation:** Target audience (all users, specific cohorts, etc.)
- **Content:**
  - Title: "[Announcement Title]"
  - Body: "[Announcement Content]"
  - Action: Link to announcement page

#### Leaderboard Updates (Optional)
- **Trigger:** When user's leaderboard position changes significantly
- **Segmentation:** Individual user (if enabled in preferences)
- **Content:**
  - Title: "Leaderboard Update"
  - Body: "You've moved to position #[Rank] on the leaderboard!"
  - Action: Link to leaderboard

#### Quiz Reminders (Optional)
- **Trigger:** Daily/weekly reminder to practice
- **Segmentation:** Users who haven't practiced in X days (if enabled)
- **Content:**
  - Title: "Time to Practice!"
  - Body: "Keep your skills sharp! Try a practice quiz today."
  - Action: Link to practice mode

---

## Segmentation Strategy

### Cohort-Based Segmentation

#### Implementation Approach:

1. **User-Cohort Mapping**
   - Users belong to cohorts (already in database)
   - Map OneSignal player IDs to cohorts
   - Create OneSignal segments for each cohort

2. **Dynamic Segment Creation**
   - When sending notifications, filter by:
     - User's cohort membership
     - Event's target cohorts
     - User preferences

3. **Segmentation Logic**

```typescript
// Pseudo-code for segmentation
function getTargetSegments(event: Event) {
  const segments = [];
  
  // Get event's target cohorts
  const targetCohorts = event.target_cohorts || [event.cohort_id];
  
  // Map cohorts to OneSignal segments
  targetCohorts.forEach(cohort => {
    segments.push(`cohort_${cohort.id}`);
  });
  
  return segments;
}

// For individual notifications
function getUserSegment(userId: string) {
  return `user_${userId}`;
}
```

### OneSignal Segment Tags

#### Tag Structure:
- `cohort_aru_year_4` - ARU Year 4 students
- `cohort_aru_year_3` - ARU Year 3 students
- `cohort_aru_year_5` - ARU Year 5 students
- `role_admin` - Administrators
- `role_meded_team` - MedEd Team
- `role_student` - Students
- `user_{userId}` - Individual user tag

#### Tag Assignment:
- Assign tags when user subscribes
- Update tags when user's cohort/role changes
- Remove tags when user unsubscribes

---

## API Routes

### 1. Subscription Management

#### POST `/api/push/subscribe`
**Purpose:** Register user for push notifications

**Request Body:**
```json
{
  "playerId": "onesignal-player-id",
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "deviceInfo": {
    "browser": "Chrome",
    "os": "Windows",
    "userAgent": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "uuid"
}
```

**Implementation:**
- Validate user session
- Store subscription in database
- Update OneSignal player with tags (cohort, role)
- Return success

#### DELETE `/api/push/unsubscribe`
**Purpose:** Remove user subscription

**Request Body:**
```json
{
  "playerId": "onesignal-player-id"
}
```

**Response:**
```json
{
  "success": true
}
```

**Implementation:**
- Mark subscription as inactive
- Remove from OneSignal (optional)
- Return success

### 2. Notification Preferences

#### GET `/api/push/preferences`
**Purpose:** Get user's notification preferences

**Response:**
```json
{
  "teaching_events": true,
  "bookings": true,
  "certificates": true,
  "feedback": true,
  "announcements": true,
  "leaderboard_updates": false,
  "quiz_reminders": false
}
```

#### PUT `/api/push/preferences`
**Purpose:** Update user's notification preferences

**Request Body:**
```json
{
  "teaching_events": true,
  "bookings": false,
  "certificates": true,
  "feedback": true,
  "announcements": true,
  "leaderboard_updates": false,
  "quiz_reminders": false
}
```

**Response:**
```json
{
  "success": true,
  "preferences": { ... }
}
```

### 3. Notification Sending (Admin/System)

#### POST `/api/push/send`
**Purpose:** Send notification (admin/system use)

**Request Body:**
```json
{
  "type": "teaching_event_reminder",
  "title": "Event Reminder",
  "body": "Your event starts tomorrow",
  "url": "/events/123",
  "segments": ["cohort_aru_year_4"],
  "playerIds": ["player-id-1", "player-id-2"], // Optional: specific users
  "scheduledFor": "2024-11-22T10:00:00Z", // Optional: schedule
  "metadata": {
    "eventId": "123",
    "eventType": "teaching"
  }
}
```

**Response:**
```json
{
  "success": true,
  "notificationId": "onesignal-notification-id",
  "recipients": 150
}
```

**Implementation:**
- Validate admin/system permissions
- Check user preferences
- Send via OneSignal API
- Log notification
- Return result

---

## Frontend Components

### 1. OneSignal Initialization Component

**File:** `components/push/OneSignalProvider.tsx`

**Purpose:** Initialize OneSignal SDK and handle subscription

**Features:**
- Load OneSignal SDK
- Request permission
- Handle subscription
- Update tags based on user data
- Handle notification clicks

### 2. Notification Permission Banner

**File:** `components/push/NotificationPermissionBanner.tsx`

**Purpose:** Prompt user to enable notifications

**Features:**
- Show banner if permission not granted
- Request permission on click
- Hide after permission granted/denied
- Remember user's choice

### 3. Notification Preferences UI

**File:** `components/push/NotificationPreferences.tsx`

**Purpose:** Allow users to manage notification preferences

**Features:**
- Toggle switches for each notification type
- Save preferences
- Show current status
- Link to subscription management

### 4. Notification Settings Page

**File:** `app/settings/notifications/page.tsx`

**Purpose:** Full notification settings page

**Features:**
- All preference toggles
- Subscription status
- Unsubscribe option
- Notification history (optional)

---

## Backend Services

### 1. Notification Service

**File:** `lib/push/notificationService.ts`

**Purpose:** Centralized notification sending logic

**Functions:**
- `sendNotification()` - Send to segments/users
- `sendToCohort()` - Send to specific cohort
- `sendToUser()` - Send to individual user
- `scheduleNotification()` - Schedule for later
- `cancelNotification()` - Cancel scheduled

### 2. Event Notification Triggers

**File:** `lib/push/eventNotifications.ts`

**Purpose:** Handle event-related notifications

**Functions:**
- `scheduleEventReminders()` - Schedule 24h and 1h reminders
- `sendEventCancellation()` - Send cancellation notice
- `sendEventUpdate()` - Send update notice

### 3. Booking Notification Triggers

**File:** `lib/push/bookingNotifications.ts`

**Purpose:** Handle booking-related notifications

**Functions:**
- `sendBookingConfirmation()` - Send confirmation
- `scheduleBookingReminder()` - Schedule reminder
- `sendBookingCancellation()` - Send cancellation

### 4. OneSignal API Client

**File:** `lib/push/onesignalClient.ts`

**Purpose:** OneSignal API wrapper

**Functions:**
- `createNotification()` - Create and send notification
- `getPlayer()` - Get player info
- `updatePlayerTags()` - Update user tags
- `cancelNotification()` - Cancel notification

---

## Implementation Steps

### Phase 1: Setup & Infrastructure (Week 1)

1. **OneSignal Account Setup**
   - Create account
   - Create web push app
   - Configure website
   - Note API keys

2. **Environment Configuration**
   - Add environment variables
   - Update `.env.local` and Vercel

3. **Database Schema**
   - Create `user_push_subscriptions` table
   - Create `user_notification_preferences` table
   - Create `notification_logs` table (optional)
   - Run migrations

4. **OneSignal SDK Installation**
   - Install OneSignal SDK
   - Create initialization component

### Phase 2: Basic Subscription (Week 1-2)

5. **Frontend Subscription**
   - Create `OneSignalProvider` component
   - Add to app layout
   - Handle permission request
   - Store subscription

6. **Backend Subscription API**
   - Create `/api/push/subscribe` endpoint
   - Create `/api/push/unsubscribe` endpoint
   - Test subscription flow

7. **Tag Management**
   - Update tags on subscription
   - Map user cohorts to tags
   - Map user roles to tags

### Phase 3: Notification Preferences (Week 2)

8. **Preferences UI**
   - Create preferences component
   - Create settings page
   - Add toggles for each type
   - Save preferences

9. **Preferences API**
   - Create GET/PUT endpoints
   - Validate preferences
   - Store in database

### Phase 4: Notification Sending (Week 2-3)

10. **Notification Service**
    - Create notification service
    - Create OneSignal client
    - Implement send functions
    - Add error handling

11. **Admin Send API**
    - Create `/api/push/send` endpoint
    - Add admin authentication
    - Test sending

12. **Test Notifications**
    - Send test to yourself
    - Verify delivery
    - Check preferences filtering

### Phase 5: Event Notifications (Week 3)

13. **Event Reminders**
    - Create reminder scheduling
    - Integrate with event creation/update
    - Schedule 24h and 1h reminders
    - Test reminders

14. **Event Updates**
    - Add trigger on event update
    - Add trigger on event cancellation
    - Test notifications

15. **Cohort Filtering**
    - Implement cohort-based segmentation
    - Filter by event target cohorts
    - Test with different cohorts

### Phase 6: Other Notifications (Week 3-4)

16. **Booking Notifications**
    - Add booking confirmation
    - Add booking reminder
    - Add cancellation notice
    - Test flow

17. **Certificate Notifications**
    - Add certificate available notification
    - Trigger on certificate generation
    - Test

18. **Feedback Notifications**
    - Add feedback request
    - Add thank you message
    - Test

### Phase 7: Testing & Refinement (Week 4)

19. **End-to-End Testing**
    - Test all notification types
    - Test segmentation
    - Test preferences
    - Test edge cases

20. **Performance Testing**
    - Test bulk sending
    - Monitor API limits
    - Optimize if needed

21. **User Testing**
    - Get user feedback
    - Refine messaging
    - Adjust timing

### Phase 8: Documentation & Launch (Week 4)

22. **Documentation**
    - Document API endpoints
    - Document notification types
    - Create user guide

23. **Launch**
    - Enable for all users
    - Monitor initial send
    - Address issues

---

## Testing Strategy

### Unit Tests

1. **Notification Service**
   - Test send functions
   - Test segmentation logic
   - Test preference filtering

2. **API Endpoints**
   - Test subscription endpoints
   - Test preferences endpoints
   - Test send endpoint (with mocks)

### Integration Tests

1. **Subscription Flow**
   - Test full subscription process
   - Test tag assignment
   - Test database storage

2. **Notification Sending**
   - Test sending to segments
   - Test sending to individuals
   - Test preference filtering

### End-to-End Tests

1. **User Journey**
   - Subscribe → Receive notification → Click → Navigate
   - Update preferences → Receive filtered notifications
   - Unsubscribe → Stop receiving

2. **Event Notifications**
   - Create event → Schedule reminders → Receive reminders
   - Update event → Receive update notification
   - Cancel event → Receive cancellation

### Manual Testing Checklist

- [ ] Subscribe to notifications
- [ ] Receive test notification
- [ ] Click notification → Navigate correctly
- [ ] Update preferences → Receive filtered notifications
- [ ] Create event → Receive reminders
- [ ] Update event → Receive update
- [ ] Cancel event → Receive cancellation
- [ ] Book session → Receive confirmation
- [ ] Receive booking reminder
- [ ] Get certificate → Receive notification
- [ ] Submit feedback → Receive thank you
- [ ] Unsubscribe → Stop receiving
- [ ] Test with different cohorts
- [ ] Test with different roles

---

## Security Considerations

### 1. Authentication
- All API endpoints require authentication
- Verify user owns subscription before updates
- Admin endpoints require admin role

### 2. Rate Limiting
- Limit notification sending rate
- Prevent spam
- Monitor OneSignal API limits

### 3. Data Privacy
- Store minimal data
- Encrypt sensitive information
- Comply with GDPR/privacy laws
- Provide unsubscribe option

### 4. Input Validation
- Validate all inputs
- Sanitize notification content
- Prevent XSS in notifications

### 5. Error Handling
- Handle OneSignal API errors gracefully
- Log errors for debugging
- Don't expose sensitive errors to users

---

## Monitoring & Analytics

### 1. OneSignal Dashboard
- Monitor delivery rates
- Track open rates
- View segment performance
- Analyze engagement

### 2. Custom Analytics
- Log all notifications sent
- Track delivery status
- Track open events
- Track click-through rates

### 3. Alerts
- Alert on high failure rates
- Alert on API limit approaching
- Alert on subscription drops

### 4. Reporting
- Weekly notification summary
- Engagement metrics
- Segment performance
- User feedback

---

## File Structure

```
project-root/
├── app/
│   ├── api/
│   │   └── push/
│   │       ├── subscribe/
│   │       │   └── route.ts
│   │       ├── unsubscribe/
│   │       │   └── route.ts
│   │       ├── preferences/
│   │       │   └── route.ts
│   │       └── send/
│   │           └── route.ts
│   └── settings/
│       └── notifications/
│           └── page.tsx
├── components/
│   └── push/
│       ├── OneSignalProvider.tsx
│       ├── NotificationPermissionBanner.tsx
│       ├── NotificationPreferences.tsx
│       └── NotificationSettings.tsx
├── lib/
│   └── push/
│       ├── notificationService.ts
│       ├── eventNotifications.ts
│       ├── bookingNotifications.ts
│       ├── onesignalClient.ts
│       └── types.ts
├── supabase/
│   └── migrations/
│       └── YYYYMMDD_add_push_notifications.sql
└── public/
    └── OneSignalSDKWorker.js (if needed)
```

---

## Dependencies

### NPM Packages
```json
{
  "dependencies": {
    "onesignal-node": "^3.0.0"
  }
}
```

### Environment Variables
```env
NEXT_PUBLIC_ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_REST_API_KEY=your-rest-api-key
ONESIGNAL_USER_AUTH_KEY=your-user-auth-key (optional)
```

---

## Cost Estimation

### OneSignal Free Tier
- **Subscribers:** Up to 10,000
- **Notifications:** Unlimited
- **Features:** All core features
- **Cost:** $0/month

### If Exceeding Free Tier
- **Growth Plan:** $9/month (up to 10k subscribers)
- **Scale Plan:** $99/month (up to 100k subscribers)

### Recommendation
- Start with free tier
- Monitor subscriber count
- Upgrade only when needed
- Consider migration to Web Push API if cost becomes issue

---

## Migration Path (Future)

If you need to migrate away from OneSignal:

1. **Export Subscriptions**
   - Export all user subscriptions
   - Store in database

2. **Implement Web Push API**
   - Set up VAPID keys
   - Create service worker
   - Migrate subscription format

3. **Gradual Migration**
   - Support both systems
   - Migrate users gradually
   - Decommission OneSignal

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Subscription Rate**
   - Target: 60%+ of active users
   - Measure: Subscriptions / Active Users

2. **Delivery Rate**
   - Target: 95%+
   - Measure: Delivered / Sent

3. **Open Rate**
   - Target: 30%+
   - Measure: Opened / Delivered

4. **Click-Through Rate**
   - Target: 15%+
   - Measure: Clicked / Opened

5. **User Satisfaction**
   - Target: 4+ stars
   - Measure: User feedback

---

## Support & Maintenance

### Regular Tasks

1. **Weekly**
   - Review notification performance
   - Check error logs
   - Monitor subscription growth

2. **Monthly**
   - Analyze engagement metrics
   - Review user feedback
   - Optimize notification timing

3. **Quarterly**
   - Review notification content
   - Update segments
   - Assess feature usage

### Troubleshooting

1. **Notifications Not Delivering**
   - Check OneSignal dashboard
   - Verify API keys
   - Check user preferences
   - Review error logs

2. **Wrong Segmentation**
   - Verify user tags
   - Check cohort mapping
   - Review segment logic

3. **High Unsubscribe Rate**
   - Review notification frequency
   - Check content relevance
   - Gather user feedback

---

## Conclusion

This implementation plan provides a comprehensive approach to integrating OneSignal push notifications into the sim-bleepy platform. The phased approach allows for gradual rollout and testing, ensuring a smooth user experience.

Key benefits:
- ✅ Personalized notifications based on cohorts
- ✅ Multiple notification types (events, bookings, certificates, feedback)
- ✅ User preference management
- ✅ Scalable architecture
- ✅ Free tier sufficient for initial growth

Next steps:
1. Review and approve this plan
2. Set up OneSignal account
3. Begin Phase 1 implementation
4. Iterate based on feedback

---

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Status:** Ready for Implementation


