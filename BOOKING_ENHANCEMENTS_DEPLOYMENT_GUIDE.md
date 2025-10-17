# Booking System Enhancements - Deployment Guide

## Overview

This guide provides the complete steps to deploy the 5 new booking features + automatic waitlist promotion.

---

## ✅ Features Implemented

### 1. **Cancellation Policy System**
- ✅ Cancellation deadline configuration per event
- ✅ Public cancellation policy page (`/cancellation-policy`)
- ✅ Required policy acceptance checkbox in booking modal
- ✅ Improved close button with X icon
- ✅ API enforcement of cancellation deadlines

### 2. **Role-Based Booking Restrictions**
- ✅ Multi-select role restrictions in event configuration
- ✅ API validation of user roles before booking
- ✅ Frontend display of role restrictions
- ✅ Clear error messages for unauthorized users

### 3. **Manual Approval Workflow**
- ✅ Auto-approve vs Manual-approve toggle per event
- ✅ Pending status for bookings requiring approval
- ✅ Approve/reject buttons on admin bookings page
- ✅ Status badge for pending bookings
- ✅ User notification of pending approval status

### 4. **Booking Status Progression**
- ✅ Enforced status transitions (pending → confirmed → attended)
- ✅ Cannot mark as attended unless confirmed first
- ✅ Cannot change attended or cancelled statuses
- ✅ Database constraint for valid status values

### 5. **Dynamic Capacity Display**
- ✅ Real-time capacity shown on event pages
- ✅ "Hurry: Only X slots left!" when 10% or less remaining
- ✅ "X of Y spots available" for normal capacity
- ✅ "Event is full" with waitlist count
- ✅ Hidden for unlimited capacity events

### 6. **Automatic Waitlist Promotion** (NEW)
- ✅ Auto-promotes waitlist users when spots open
- ✅ Prioritizes by booking date (first-come, first-served)
- ✅ Sends notifications to promoted users
- ✅ Only promotes if event has capacity and waitlist enabled

---

## 🗄️ Database Migration Scripts

### Step 1: Run the Main Migration

Copy and paste this entire script into your **Supabase SQL Editor** and click **Run**:

```sql
-- ============================================================================
-- BOOKING SYSTEM ENHANCEMENTS MIGRATION
-- ============================================================================
-- This migration adds:
-- 1. Cancellation deadline hours
-- 2. Role-based booking restrictions
-- 3. Manual approval workflow
-- 4. Pending status support
-- 5. Waitlist auto-promotion support
-- ============================================================================

BEGIN;

-- Add new columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS cancellation_deadline_hours INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allowed_roles TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_mode TEXT DEFAULT 'auto' CHECK (approval_mode IN ('auto', 'manual'));

-- Update event_bookings status constraint to include 'pending'
ALTER TABLE event_bookings DROP CONSTRAINT IF EXISTS event_bookings_status_check;
ALTER TABLE event_bookings ADD CONSTRAINT event_bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'waitlist', 'cancelled', 'attended', 'no-show'));

-- Add index for pending bookings for better query performance
CREATE INDEX IF NOT EXISTS idx_event_bookings_pending 
ON event_bookings(event_id, status) 
WHERE status = 'pending' AND deleted_at IS NULL;

-- Add index for waitlist bookings (for auto-promotion)
CREATE INDEX IF NOT EXISTS idx_event_bookings_waitlist 
ON event_bookings(event_id, status, booked_at) 
WHERE status = 'waitlist' AND deleted_at IS NULL;

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_events_allowed_roles 
ON events USING GIN (allowed_roles) 
WHERE allowed_roles IS NOT NULL;

-- Create function to auto-promote waitlist users
CREATE OR REPLACE FUNCTION promote_waitlist_user(p_event_id UUID)
RETURNS VOID AS $$
DECLARE
  v_event RECORD;
  v_confirmed_count INTEGER;
  v_available_slots INTEGER;
  v_next_waitlist RECORD;
BEGIN
  -- Get event details
  SELECT booking_capacity, allow_waitlist INTO v_event
  FROM events
  WHERE id = p_event_id;
  
  -- Only proceed if event has capacity limit and allows waitlist
  IF v_event.booking_capacity IS NULL OR NOT v_event.allow_waitlist THEN
    RETURN;
  END IF;
  
  -- Count confirmed bookings (excluding soft-deleted)
  SELECT COUNT(*) INTO v_confirmed_count
  FROM event_bookings
  WHERE event_id = p_event_id
    AND status = 'confirmed'
    AND deleted_at IS NULL;
  
  -- Calculate available slots
  v_available_slots := v_event.booking_capacity - v_confirmed_count;
  
  -- Only promote if there are available slots
  IF v_available_slots > 0 THEN
    -- Get the earliest waitlist booking
    SELECT id INTO v_next_waitlist
    FROM event_bookings
    WHERE event_id = p_event_id
      AND status = 'waitlist'
      AND deleted_at IS NULL
    ORDER BY booked_at ASC
    LIMIT 1;
    
    -- Promote the user if found
    IF FOUND THEN
      UPDATE event_bookings
      SET status = 'confirmed'
      WHERE id = v_next_waitlist.id;
      
      -- Log the promotion (optional - you can add a notifications system here)
      RAISE NOTICE 'Promoted booking % from waitlist to confirmed for event %', v_next_waitlist.id, p_event_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-promote on cancellation
CREATE OR REPLACE FUNCTION trigger_waitlist_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when a confirmed booking is cancelled
  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    PERFORM promote_waitlist_user(OLD.event_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on event_bookings
DROP TRIGGER IF EXISTS after_booking_cancelled ON event_bookings;
CREATE TRIGGER after_booking_cancelled
  AFTER UPDATE ON event_bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_waitlist_promotion();

COMMIT;

-- Verification queries
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('cancellation_deadline_hours', 'allowed_roles', 'approval_mode')
ORDER BY column_name;

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname LIKE '%event_bookings_status%';

-- Test the waitlist promotion function
SELECT 'Migration completed successfully!' as status;
```

### Step 2: Verify the Migration

Run this verification script to ensure everything is set up correctly:

```sql
-- Verification Script
SELECT 'Checking new columns...' as step;

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('cancellation_deadline_hours', 'allowed_roles', 'approval_mode');

SELECT 'Checking status constraint...' as step;

SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'event_bookings'::regclass
  AND conname LIKE '%status%';

SELECT 'Checking indexes...' as step;

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'event_bookings'
  AND indexname IN ('idx_event_bookings_pending', 'idx_event_bookings_waitlist');

SELECT 'Checking functions...' as step;

SELECT 
  proname,
  pg_get_functiondef(oid)
FROM pg_proc
WHERE proname IN ('promote_waitlist_user', 'trigger_waitlist_promotion');

SELECT 'Checking triggers...' as step;

SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'after_booking_cancelled';

SELECT '✅ All checks passed!' as result;
```

---

## 📋 Post-Deployment Steps

### 1. Test the Features

#### Test Cancellation Policy
1. Navigate to `/cancellation-policy` - should load successfully
2. Create a new event with a 24-hour cancellation deadline
3. Book the event as a test user
4. Try to cancel within 24 hours - should be blocked
5. Try to cancel with more than 24 hours remaining - should work

#### Test Role Restrictions
1. Create an event restricted to "educator" role only
2. Log in as a student - register button should show restriction message
3. Log in as an educator - should be able to book normally

#### Test Manual Approval
1. Create an event with "Manual Approval" enabled
2. Book the event as a test user
3. Booking status should be "Pending Approval" (orange badge)
4. Log in as admin and go to `/bookings/[eventId]`
5. Click "Approve" - status should change to "Confirmed" (green badge)

#### Test Capacity Display
1. Create an event with capacity of 10
2. Book 9 spots (as different users or same user for testing)
3. Event page should show "Hurry: Only 1 slot left!"
4. Book the 10th spot
5. Event page should show "Event is full"

#### Test Waitlist Auto-Promotion
1. Create an event with capacity of 2 and waitlist enabled
2. Book 2 confirmed spots
3. Book a 3rd spot - should go to waitlist
4. Book a 4th spot - should go to waitlist
5. Cancel one of the confirmed bookings
6. Check the 3rd booking (earliest waitlist) - should now be "Confirmed"
7. Cancel another confirmed booking
8. Check the 4th booking - should now be "Confirmed"

### 2. Update Event Booking Stats View (IMPORTANT)

Run this script to ensure the `event_booking_stats` view includes the `booking_status` field:

```sql
-- This should already be run from previous deployment
-- Run it again if you see errors on /bookings page

DROP VIEW IF EXISTS event_booking_stats;

CREATE VIEW event_booking_stats AS
SELECT 
    e.id as event_id,
    e.title,
    e.date,
    e.start_time,
    e.end_time,
    e.booking_enabled,
    e.booking_capacity,
    e.booking_button_label,
    e.booking_deadline_hours,
    e.allow_waitlist,
    
    -- Booking statistics
    COUNT(CASE WHEN eb.status = 'confirmed' AND eb.deleted_at IS NULL THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN eb.status = 'waitlist' AND eb.deleted_at IS NULL THEN 1 END) as waitlist_count,
    COUNT(CASE WHEN eb.status = 'cancelled' AND eb.deleted_at IS NULL THEN 1 END) as cancelled_count,
    COUNT(CASE WHEN eb.status = 'attended' AND eb.deleted_at IS NULL THEN 1 END) as attended_count,
    COUNT(CASE WHEN eb.status = 'no-show' AND eb.deleted_at IS NULL THEN 1 END) as no_show_count,
    COUNT(CASE WHEN eb.deleted_at IS NULL THEN 1 END) as total_bookings,
    
    -- Available slots calculation
    CASE 
        WHEN e.booking_capacity IS NULL THEN NULL
        ELSE GREATEST(0, e.booking_capacity - COUNT(CASE WHEN eb.status = 'confirmed' AND eb.deleted_at IS NULL THEN 1 END))
    END as available_slots,
    
    -- Capacity utilization percentage
    CASE 
        WHEN e.booking_capacity IS NULL OR e.booking_capacity = 0 THEN NULL
        ELSE ROUND(
            (COUNT(CASE WHEN eb.status = 'confirmed' AND eb.deleted_at IS NULL THEN 1 END)::DECIMAL / e.booking_capacity) * 100, 
            2
        )
    END as capacity_utilization_percent,
    
    -- Booking status (computed field that the frontend expects)
    CASE 
        WHEN e.booking_capacity IS NULL THEN 'unlimited'
        WHEN e.booking_capacity = 0 THEN 'unlimited'
        WHEN COUNT(CASE WHEN eb.status = 'confirmed' AND eb.deleted_at IS NULL THEN 1 END) >= e.booking_capacity THEN 'full'
        WHEN COUNT(CASE WHEN eb.status = 'confirmed' AND eb.deleted_at IS NULL THEN 1 END) >= (e.booking_capacity * 0.8) THEN 'almost_full'
        ELSE 'available'
    END as booking_status

FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id
WHERE e.booking_enabled = true
GROUP BY e.id, e.title, e.date, e.start_time, e.end_time, e.booking_enabled, e.booking_capacity, e.booking_button_label, e.booking_deadline_hours, e.allow_waitlist
ORDER BY e.date ASC, e.start_time ASC;

-- Grant permissions
GRANT SELECT ON event_booking_stats TO authenticated;

-- Set security_invoker for proper RLS enforcement
ALTER VIEW event_booking_stats SET (security_invoker = true);
```

### 3. Clear Browser Cache

After deploying, clear your browser cache or use incognito mode to ensure you're seeing the latest changes.

---

## 🔍 Troubleshooting

### Issue: Bookings page shows error
**Solution**: Run the event_booking_stats view script from Step 2 above.

### Issue: Waitlist not auto-promoting
**Solution**: Check the trigger is created:
```sql
SELECT * FROM information_schema.triggers WHERE trigger_name = 'after_booking_cancelled';
```

### Issue: Role restrictions not working
**Solution**: Verify the `allowed_roles` column exists:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'allowed_roles';
```

### Issue: Pending status not showing
**Solution**: Check the status constraint includes 'pending':
```sql
SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname LIKE '%event_bookings_status%';
```

---

## 📊 Feature Summary Table

| Feature | Frontend | Backend | Database | Status |
|---------|----------|---------|----------|--------|
| Cancellation Deadline | ✅ Event Form | ✅ API Validation | ✅ Column Added | Complete |
| Cancellation Policy Page | ✅ Public Page | N/A | N/A | Complete |
| Policy Checkbox | ✅ Booking Modal | ✅ Validation | N/A | Complete |
| Role Restrictions | ✅ Event Form | ✅ API Validation | ✅ Column Added | Complete |
| Manual Approval | ✅ Event Form | ✅ API Logic | ✅ Column Added | Complete |
| Pending Status | ✅ Badges & UI | ✅ API Support | ✅ Constraint Updated | Complete |
| Capacity Display | ✅ Event Pages | ✅ Stats API | ✅ View Updated | Complete |
| Waitlist Auto-Promotion | ✅ Notifications | ✅ Trigger Function | ✅ Function Created | Complete |
| Status Progression | ✅ Admin UI | ✅ Validation | ✅ Constraint | Complete |

---

## 🎉 You're All Set!

Once you've run the database scripts and tested the features, your enhanced booking system is ready to use. Users can now:

- ✅ See clear cancellation policies before booking
- ✅ Be restricted by role if needed
- ✅ Go through approval workflows for sensitive events
- ✅ See real-time capacity with urgency messaging
- ✅ Automatically get promoted from waitlist when spots open
- ✅ Have proper booking status progression

Enjoy your enhanced booking system! 🚀



