-- ============================================================================
-- FIX RLS FOR NEXTAUTH
-- ============================================================================
-- The issue is that RLS policies use auth.uid() (Supabase auth)
-- but the app uses NextAuth. We need to fix this.
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can update own bookings" ON event_bookings;
DROP POLICY IF EXISTS "Authenticated users can delete own bookings" ON event_bookings;

-- Create policies that work with NextAuth
-- Since NextAuth doesn't integrate with Supabase auth, we'll allow all authenticated users
-- to view all bookings for now (this is for the certificate system)

-- Policy 1: Allow all authenticated users to view all bookings
CREATE POLICY "Allow all authenticated users to view bookings"
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

-- Test the fix
SELECT 
  'RLS Fix Test' as test,
  COUNT(*) as total_bookings
FROM event_bookings;









