-- Clean up unnecessary seed data
-- This will remove all bookings except the one for your specific event

-- First, let's see what we're about to delete
SELECT 
  eb.id,
  eb.event_id,
  e.title as event_title,
  eb.status,
  eb.user_id,
  u.name as user_name
FROM event_bookings eb
JOIN events e ON eb.event_id = e.id
JOIN users u ON eb.user_id = u.id
ORDER BY eb.event_id, eb.status;

-- Delete all bookings EXCEPT the one for your specific event
DELETE FROM event_bookings 
WHERE event_id != '281fef32-611a-4dcc-acab-e1994e822a80';

-- Verify what's left
SELECT 
  eb.id,
  eb.event_id,
  e.title as event_title,
  eb.status,
  eb.user_id,
  u.name as user_name
FROM event_bookings eb
JOIN events e ON eb.event_id = e.id
JOIN users u ON eb.user_id = u.id;

-- Check the count
SELECT COUNT(*) as remaining_bookings FROM event_bookings;









