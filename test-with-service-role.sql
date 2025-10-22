-- Test with service role (bypasses RLS)
-- This is for testing only - don't use in production

-- Check if the booking exists (bypasses RLS)
SELECT 
  'Booking exists (service role)' as test,
  id,
  event_id,
  user_id,
  status,
  checked_in
FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Check the user from the booking
SELECT 
  'Booking user details' as test,
  id,
  name,
  email,
  role
FROM users 
WHERE id = '02c99dc5-1a2b-4e42-8965-f46ac1f84858';










