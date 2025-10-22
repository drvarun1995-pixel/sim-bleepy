-- Debug: Check what bookings exist in your database
-- Run this in Supabase SQL Editor to see what's in your event_bookings table

-- 1. Check if event_bookings table exists and has data
SELECT 'event_bookings table exists:' as check_type, COUNT(*) as count FROM event_bookings;

-- 2. Show sample bookings
SELECT 
  eb.id,
  eb.event_id,
  eb.user_id,
  eb.status,
  eb.checked_in,
  e.title as event_title,
  u.name as user_name,
  u.email
FROM event_bookings eb
LEFT JOIN events e ON eb.event_id = e.id
LEFT JOIN users u ON eb.user_id = u.id
ORDER BY eb.booked_at DESC
LIMIT 10;

-- 3. Check which events have bookings
SELECT 
  e.id,
  e.title,
  e.booking_enabled,
  COUNT(eb.id) as booking_count
FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id AND eb.status != 'cancelled'
GROUP BY e.id, e.title, e.booking_enabled
ORDER BY booking_count DESC;

-- 4. Check the specific event you're testing with
SELECT 
  'Event 281fef32-611a-4dcc-acab-e1994e822a80:' as event_id,
  e.title,
  e.booking_enabled,
  COUNT(eb.id) as booking_count
FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id AND eb.status != 'cancelled'
WHERE e.id = '281fef32-611a-4dcc-acab-e1994e822a80'
GROUP BY e.id, e.title, e.booking_enabled;










