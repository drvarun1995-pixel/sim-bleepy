-- =====================================================
-- CHECK IF BOOKING FIELDS EXIST IN EVENTS TABLE
-- =====================================================
-- Run this to verify booking fields are properly added
-- =====================================================

-- Check if booking columns exist in events table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name LIKE 'booking%'
ORDER BY column_name;

-- Check if booking columns exist in events_with_details view
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
  AND column_name LIKE 'booking%'
ORDER BY column_name;

-- Sample a few events to see booking data
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
WHERE booking_enabled IS NOT NULL 
LIMIT 5;

