-- Create a booking for your currently logged-in user
-- Run this in Supabase SQL Editor while logged in as the user you want to test with

INSERT INTO event_bookings (event_id, user_id, status, checked_in, booked_at)
VALUES (
  '281fef32-611a-4dcc-acab-e1994e822a80', -- Your event ID
  auth.uid(), -- This will insert for your currently logged-in user
  'confirmed',
  true,
  NOW()
);

-- Check if it was created
SELECT * FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80' 
AND user_id = auth.uid();









