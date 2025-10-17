-- ============================================================================
-- SETUP ROW LEVEL SECURITY FOR EVENT BOOKINGS
-- ============================================================================
-- This migration sets up RLS policies for the event_bookings table
-- 
-- Access Control:
-- - Users can view and manage their own bookings
-- - Admins (admin, meded_team, ctf, educator) can view and manage all bookings
-- - Users can create bookings for any event
-- - Users can only cancel their own bookings
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setting up RLS Policies for Event Bookings';
  RAISE NOTICE '========================================';
END $$;

-- Enable RLS on event_bookings table
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

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

-- Policy 4: Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
);

-- Policy 5: Admins can update all bookings (mark attended, move waitlist, etc.)
CREATE POLICY "Admins can update all bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
);

-- Policy 6: Admins can delete bookings (for data cleanup)
CREATE POLICY "Admins can delete bookings"
ON event_bookings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
);

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS Policies Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policies created:';
  RAISE NOTICE '  - Users can view own bookings';
  RAISE NOTICE '  - Users can create bookings';
  RAISE NOTICE '  - Users can update own bookings';
  RAISE NOTICE '  - Admins can view all bookings';
  RAISE NOTICE '  - Admins can update all bookings';
  RAISE NOTICE '  - Admins can delete bookings';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin roles with full access:';
  RAISE NOTICE '  - admin';
  RAISE NOTICE '  - meded_team';
  RAISE NOTICE '  - ctf';
  RAISE NOTICE '  - educator';
  RAISE NOTICE '';
  RAISE NOTICE 'Regular users can only:';
  RAISE NOTICE '  - View their own bookings';
  RAISE NOTICE '  - Create new bookings';
  RAISE NOTICE '  - Cancel their own bookings';
  RAISE NOTICE '========================================';
END $$;

