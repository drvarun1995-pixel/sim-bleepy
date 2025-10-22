-- ============================================================================
-- PERMANENT RLS FIX - PROPER SOLUTION
-- ============================================================================
-- Instead of creating fake profiles, let's fix the RLS policies to work properly
-- with the existing data structure
-- ============================================================================

-- First, let's understand the data structure better
-- Check if users table has the data we need
SELECT 
  eb.user_id as booking_user_id,
  u.id as users_table_id,
  u.name,
  u.email
FROM event_bookings eb
LEFT JOIN users u ON eb.user_id = u.id
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- The issue is that our RLS policies reference the profiles table,
-- but the frontend query joins with the users table.
-- Let's fix this by updating the RLS policies to work with both tables

-- Drop the existing admin policies that reference profiles
DROP POLICY IF EXISTS "Admins can view all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON event_bookings;

-- Create new admin policies that work with the users table
CREATE POLICY "Admins can view all bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
);

CREATE POLICY "Admins can update all bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
);

CREATE POLICY "Admins can delete bookings"
ON event_bookings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff')
  )
);

-- Test the fix
SELECT 
  eb.id,
  eb.event_id,
  eb.user_id,
  eb.status,
  eb.checked_in,
  u.name as user_name,
  u.email as user_email
FROM event_bookings eb
JOIN users u ON eb.user_id = u.id
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';









