-- ============================================================================
-- PROPER NEXTAUTH + SUPABASE RLS INTEGRATION
-- ============================================================================
-- This creates a proper integration between NextAuth and Supabase RLS
-- ============================================================================

-- First, re-enable RLS
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all authenticated users to view bookings" ON event_bookings;
DROP POLICY IF EXISTS "Allow authenticated users to create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Allow authenticated users to update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Allow authenticated users to delete bookings" ON event_bookings;

-- Create a function to check if user exists in profiles table
-- This will work with NextAuth users who have profiles
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  -- This function will be used by RLS policies
  -- It returns the user ID from the JWT token
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), ''),
    '{}'
  )::json->>'sub'::UUID;
$$;

-- Policy 1: Allow users to view bookings if they have a profile
CREATE POLICY "Users with profiles can view bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
  OR
  -- Allow if user exists in users table (for NextAuth compatibility)
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
  )
);

-- Policy 2: Allow users to create bookings
CREATE POLICY "Users can create bookings"
ON event_bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
  )
);

-- Policy 3: Allow users to update their own bookings
CREATE POLICY "Users can update own bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
    )
  )
)
WITH CHECK (
  (user_id = auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
    )
  )
);

-- Policy 4: Allow users to delete their own bookings
CREATE POLICY "Users can delete own bookings"
ON event_bookings FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
    )
  )
);

-- Test the policies
SELECT 
  'RLS Policies Test' as test,
  COUNT(*) as total_bookings
FROM event_bookings;








