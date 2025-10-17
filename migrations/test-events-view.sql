-- =====================================================
-- TEST EVENTS_WITH_DETAILS VIEW
-- =====================================================
-- Run this to see what columns are actually in the view
-- =====================================================

-- Check what columns exist in the view
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
  AND column_name LIKE 'booking%'
ORDER BY column_name;

-- Test query to see if booking fields are accessible
SELECT 
  id,
  title,
  booking_enabled,
  booking_button_label,
  booking_capacity
FROM events_with_details 
LIMIT 1;

