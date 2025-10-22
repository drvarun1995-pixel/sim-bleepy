-- ============================================================================
-- CLEAN AND SETUP RLS - DROP ALL EXISTING POLICIES FIRST
-- ============================================================================
-- This script drops all existing policies and creates fresh ones
-- ============================================================================

-- Drop ALL existing policies on event_bookings
DROP POLICY IF EXISTS "Allow authenticated users to view bookings" ON event_bookings;
DROP POLICY IF EXISTS "Allow authenticated users to create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Allow authenticated users to update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Allow authenticated users to delete bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can view bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can view bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can delete bookings" ON event_bookings;
DROP POLICY IF EXISTS "Users can view bookings if they exist in users table" ON event_bookings;
DROP POLICY IF EXISTS "Users can create bookings if they exist in users table" ON event_bookings;
DROP POLICY IF EXISTS "Users can update bookings if they exist in users table" ON event_bookings;
DROP POLICY IF EXISTS "Users can delete bookings if they exist in users table" ON event_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON event_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON event_bookings;

-- Re-enable RLS
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
CREATE POLICY "Authenticated users can view bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create bookings"
ON event_bookings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bookings"
ON event_bookings FOR DELETE
TO authenticated
USING (true);

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'event_bookings';

-- Verify policies are created
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'event_bookings';

-- Test that the setup works
SELECT 
  'Clean RLS Test' as test,
  COUNT(*) as total_bookings
FROM event_bookings;








