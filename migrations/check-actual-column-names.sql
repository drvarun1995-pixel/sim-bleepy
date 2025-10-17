-- =====================================================
-- CHECK ACTUAL COLUMN NAMES IN EVENT_BOOKINGS
-- =====================================================
-- Based on your screenshot, let's verify the exact column names
-- =====================================================

-- Check all columns in event_bookings table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'event_bookings'
ORDER BY ordinal_position;

-- Test a simple query to see the actual data structure
SELECT * FROM event_bookings LIMIT 1;

