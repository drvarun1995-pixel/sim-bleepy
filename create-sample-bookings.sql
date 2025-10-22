-- Create Sample Event Bookings for Testing
-- Run this AFTER creating the event_bookings table

-- First, let's see what events exist
SELECT id, title, date FROM events WHERE status = 'published' LIMIT 5;

-- Create sample bookings (replace the UUIDs with actual event and user IDs from your database)
-- You can get these by running the SELECT above

-- Example: Create bookings for the first event (replace with actual event ID)
INSERT INTO event_bookings (event_id, user_id, status, checked_in, booked_at)
SELECT 
  (SELECT id FROM events WHERE status = 'published' ORDER BY date DESC LIMIT 1), -- First published event
  users.id, -- All users
  'confirmed',
  CASE WHEN random() > 0.3 THEN true ELSE false END, -- Random check-in status
  NOW() - (random() * interval '30 days') -- Random booking date in last 30 days
FROM users 
WHERE users.email IS NOT NULL
LIMIT 10; -- Limit to 10 users

-- Check the results
SELECT 
  eb.id,
  e.title as event_title,
  u.name as user_name,
  u.email,
  eb.status,
  eb.checked_in,
  eb.booked_at
FROM event_bookings eb
JOIN events e ON eb.event_id = e.id
JOIN users u ON eb.user_id = u.id
ORDER BY eb.booked_at DESC;









