-- Simple booking check - one query at a time

-- Query 1: Check if the booking exists at all
SELECT 
  'Booking exists' as test,
  id,
  event_id,
  user_id,
  status,
  checked_in
FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Query 2: Check your current user
SELECT 
  'Current user' as test,
  auth.uid() as user_id;

-- Query 3: Check if you're admin in users table
SELECT 
  'Admin check users' as test,
  id,
  email,
  role
FROM users 
WHERE id = auth.uid();

-- Query 4: Check if you're admin in profiles table
SELECT 
  'Admin check profiles' as test,
  id,
  email,
  role
FROM profiles 
WHERE id = auth.uid();









