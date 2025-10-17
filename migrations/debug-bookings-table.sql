-- =====================================================
-- DEBUG BOOKINGS TABLE ISSUE
-- =====================================================
-- Let's check what's wrong with the bookings API
-- =====================================================

-- 1. Check if event_bookings table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'event_bookings';

-- 2. Check columns in event_bookings table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_bookings'
ORDER BY ordinal_position;

-- 3. Check if events table exists and has booking fields
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name LIKE 'booking%'
ORDER BY column_name;

-- 4. Check if users table exists
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. Try a simple query on event_bookings (if it exists)
SELECT COUNT(*) as booking_count FROM event_bookings;

-- 6. Check if there are any bookings
SELECT * FROM event_bookings LIMIT 5;

