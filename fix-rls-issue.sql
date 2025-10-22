-- Fix the RLS issue by creating a booking for your current user
-- Run this in Supabase SQL Editor while logged in as the user you want to test with

-- First, check who you are
SELECT 
  auth.uid() as current_user_id,
  p.email,
  p.role,
  p.name
FROM profiles p
WHERE p.id = auth.uid();

-- Create a booking for your current user for the test event
INSERT INTO event_bookings (event_id, user_id, status, checked_in, booked_at)
VALUES (
  '281fef32-611a-4dcc-acab-e1994e822a80', -- Your event ID
  auth.uid(), -- Your current user ID
  'confirmed',
  true,
  NOW()
);

-- Verify the booking was created
SELECT 
  eb.id,
  eb.event_id,
  eb.user_id,
  eb.status,
  eb.checked_in,
  u.name as user_name,
  u.email
FROM event_bookings eb
JOIN users u ON eb.user_id = u.id
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';









