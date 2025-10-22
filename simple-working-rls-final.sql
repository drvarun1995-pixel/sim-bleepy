-- ============================================================================
-- SIMPLE WORKING RLS - FINAL VERSION
-- ============================================================================
-- This creates simple RLS policies that work with your current setup
-- ============================================================================

-- Re-enable RLS
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can view bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can delete bookings" ON event_bookings;

-- Create simple policies that work with authenticated users
-- Policy 1: Allow authenticated users to view bookings
CREATE POLICY "Allow authenticated users to view bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow authenticated users to create bookings
CREATE POLICY "Allow authenticated users to create bookings"
ON event_bookings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update bookings
CREATE POLICY "Allow authenticated users to update bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete bookings
CREATE POLICY "Allow authenticated users to delete bookings"
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
  'Simple RLS Test' as test,
  COUNT(*) as total_bookings
FROM event_bookings;








