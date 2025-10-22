-- ============================================================================
-- SECURE RLS POLICIES FOR EVENT BOOKINGS
-- ============================================================================
-- This creates more secure RLS policies that address common security concerns
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON event_bookings;

-- More secure policies that check for actual user existence
-- Policy 1: Users can only view bookings if they exist in the users table
CREATE POLICY "Users can view bookings if they exist in users table"
ON event_bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Policy 2: Users can create bookings if they exist in the users table
CREATE POLICY "Users can create bookings if they exist in users table"
ON event_bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Policy 3: Users can update bookings if they exist in users table
CREATE POLICY "Users can update bookings if they exist in users table"
ON event_bookings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Policy 4: Users can delete bookings if they exist in users table
CREATE POLICY "Users can delete bookings if they exist in users table"
ON event_bookings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Test the policies
SELECT 
  'Secure RLS Test' as test,
  COUNT(*) as total_bookings
FROM event_bookings;

-- Verify the policies were created
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'event_bookings';









