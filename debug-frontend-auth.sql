-- Debug frontend authentication issue
-- This will help us understand why the frontend query fails

-- Check if there are any RLS policies that might be blocking the query
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'event_bookings';

-- Check the current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'event_bookings';

-- Test a simple query that should work
SELECT 
  'Simple test' as test,
  id,
  event_id,
  user_id,
  status
FROM event_bookings 
LIMIT 5;










