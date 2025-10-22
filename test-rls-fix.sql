-- Test if the RLS fix worked
-- Run this in Supabase SQL Editor

-- Check if the new policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'event_bookings';

-- Test if we can see bookings now (this should work if RLS is fixed)
SELECT 
  'RLS Test Result' as test,
  id,
  event_id,
  user_id,
  status,
  checked_in
FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Check total bookings count
SELECT 
  'Total Bookings' as test,
  COUNT(*) as count
FROM event_bookings;









