-- ============================================================================
-- TEMPORARILY DISABLE RLS FOR TESTING
-- ============================================================================
-- This will disable RLS on event_bookings to test if that's the issue
-- IMPORTANT: Re-enable RLS after testing!
-- ============================================================================

-- Disable RLS temporarily
ALTER TABLE event_bookings DISABLE ROW LEVEL SECURITY;

-- Test if the query works now
SELECT 
  'RLS Disabled Test' as test,
  COUNT(*) as total_bookings
FROM event_bookings;

-- Test the specific query
SELECT 
  id,
  event_id,
  user_id,
  status,
  checked_in
FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- After testing, re-enable RLS with working policies:
-- ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
-- Then run the fix-rls-for-nextauth.sql script








