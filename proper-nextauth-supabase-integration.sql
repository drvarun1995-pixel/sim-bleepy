-- ============================================================================
-- PROPER NEXTAUTH + SUPABASE INTEGRATION
-- ============================================================================
-- This creates a proper integration between NextAuth and Supabase auth
-- ============================================================================

-- Re-enable RLS
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Server-side queries can view bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can update bookings" ON event_bookings;
DROP POLICY IF EXISTS "Server-side queries can delete bookings" ON event_bookings;

-- Create a function to get the current user ID from JWT
-- This will work with both NextAuth and Supabase auth
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), ''),
    '{}'
  )::json->>'sub'::UUID;
$$;

-- Create policies that work with both client and server-side operations
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

-- Test the function
SELECT 
  'Auth Function Test' as test,
  public.current_user_id() as current_user_id;

-- Test the policies
SELECT 
  'RLS Policies Test' as test,
  COUNT(*) as total_bookings
FROM event_bookings;
