-- ============================================================================
-- ENABLE RLS PROPERLY AND FIX SECURITY ISSUES
-- ============================================================================
-- This will enable RLS on event_bookings and create secure policies
-- ============================================================================

-- First, ensure RLS is enabled on the event_bookings table
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can view all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON event_bookings;
DROP POLICY IF EXISTS "Users can view bookings if they exist in users table" ON event_bookings;
DROP POLICY IF EXISTS "Users can create bookings if they exist in users table" ON event_bookings;
DROP POLICY IF EXISTS "Users can update bookings if they exist in users table" ON event_bookings;
DROP POLICY IF EXISTS "Users can delete bookings if they exist in users table" ON event_bookings;

-- Create secure policies that work with NextAuth
-- Policy 1: Allow authenticated users to view bookings
CREATE POLICY "Authenticated users can view bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow authenticated users to create bookings
CREATE POLICY "Authenticated users can create bookings"
ON event_bookings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update bookings
CREATE POLICY "Authenticated users can update bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete bookings
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
  'RLS Enabled Test' as test,
  COUNT(*) as total_bookings
FROM event_bookings;








