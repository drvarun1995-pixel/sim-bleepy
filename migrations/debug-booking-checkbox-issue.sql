-- =====================================================
-- DEBUG BOOKING CHECKBOX ISSUE
-- =====================================================
-- Let's check what's actually happening with the booking fields
-- =====================================================

-- 1. Check if booking fields exist in events table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name LIKE 'booking%'
ORDER BY column_name;

-- 2. Check current booking values for all events
SELECT 
  id,
  title,
  booking_enabled,
  booking_button_label,
  booking_capacity,
  booking_deadline_hours,
  allow_waitlist,
  confirmation_checkbox_1_text,
  confirmation_checkbox_1_required,
  confirmation_checkbox_2_text,
  confirmation_checkbox_2_required
FROM events 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if events_with_details view includes booking fields
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
  AND column_name LIKE 'booking%'
ORDER BY column_name;

-- 4. Test querying booking fields from the view
SELECT 
  id,
  title,
  booking_enabled,
  booking_button_label
FROM events_with_details 
LIMIT 3;

-- 5. Count how many events have booking_enabled = true
SELECT 
  COUNT(*) as total_events,
  COUNT(CASE WHEN booking_enabled = true THEN 1 END) as booking_enabled_count,
  COUNT(CASE WHEN booking_enabled = false THEN 1 END) as booking_disabled_count,
  COUNT(CASE WHEN booking_enabled IS NULL THEN 1 END) as booking_null_count
FROM events;

