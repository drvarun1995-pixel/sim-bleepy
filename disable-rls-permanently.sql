-- ============================================================================
-- DISABLE RLS PERMANENTLY FOR EVENT BOOKINGS
-- ============================================================================
-- Since NextAuth and Supabase auth are separate systems,
-- and the certificate system needs to work reliably,
-- we'll disable RLS on event_bookings and rely on API route authentication
-- ============================================================================

-- Disable RLS on event_bookings
ALTER TABLE event_bookings DISABLE ROW LEVEL SECURITY;

-- Drop all policies (they're not needed if RLS is disabled)
DROP POLICY IF EXISTS "Server-side queries can view bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can delete bookings" ON event_bookings;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'event_bookings';

-- Test that queries work
SELECT 
  'RLS Disabled Test' as test,
  COUNT(*) as total_bookings
FROM event_bookings;








