-- ============================================================================
-- FIX EVENT BOOKINGS RLS POLICIES PROPERLY
-- ============================================================================
-- This script fixes the RLS policies for event_bookings to work correctly
-- by referencing the profiles table instead of users table for role checking
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing Event Bookings RLS Policies';
  RAISE NOTICE '========================================';
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own bookings" ON event_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON event_bookings;

-- Policy 1: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can create bookings for any event
CREATE POLICY "Users can create bookings"
ON event_bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own bookings (mainly for cancellation)
CREATE POLICY "Users can update own bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can view all bookings (FIXED - using profiles table)
CREATE POLICY "Admins can view all bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
);

-- Policy 5: Admins can update all bookings (FIXED - using profiles table)
CREATE POLICY "Admins can update all bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
);

-- Policy 6: Admins can delete bookings (FIXED - using profiles table)
CREATE POLICY "Admins can delete bookings"
ON event_bookings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
);

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS Policies Fixed Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policies updated:';
  RAISE NOTICE '  - Users can view own bookings';
  RAISE NOTICE '  - Users can create bookings';
  RAISE NOTICE '  - Users can update own bookings';
  RAISE NOTICE '  - Admins can view all bookings (FIXED)';
  RAISE NOTICE '  - Admins can update all bookings (FIXED)';
  RAISE NOTICE '  - Admins can delete bookings (FIXED)';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin roles with full access:';
  RAISE NOTICE '  - admin';
  RAISE NOTICE '  - meded_team';
  RAISE NOTICE '  - ctf';
  RAISE NOTICE '  - educator';
  RAISE NOTICE '  - staff';
  RAISE NOTICE '';
  RAISE NOTICE 'Regular users can only:';
  RAISE NOTICE '  - View their own bookings';
  RAISE NOTICE '  - Create new bookings';
  RAISE NOTICE '  - Cancel their own bookings';
  RAISE NOTICE '========================================';
END $$;










