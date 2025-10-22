-- ============================================================================
-- TEMPORARY DISABLE RLS FOR TESTING
-- ============================================================================
-- This will temporarily disable RLS to test if that's the issue
-- IMPORTANT: Re-enable RLS after testing!
-- ============================================================================

-- Disable RLS temporarily
ALTER TABLE event_bookings DISABLE ROW LEVEL SECURITY;

-- Test the query that should work
SELECT 
  eb.id,
  eb.event_id,
  eb.user_id,
  eb.checked_in,
  eb.status,
  u.id as user_table_id,
  u.name,
  u.email
FROM event_bookings eb
LEFT JOIN users u ON eb.user_id = u.id
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- If this works, then RLS is the issue
-- After testing, re-enable RLS:
-- ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;










