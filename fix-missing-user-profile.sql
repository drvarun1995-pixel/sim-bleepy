-- ============================================================================
-- FIX MISSING USER PROFILE
-- ============================================================================
-- The booking exists but the user doesn't have a profile
-- Let's create a profile for the missing user
-- ============================================================================

-- Check what user_id we're missing
SELECT 
  eb.user_id as missing_user_id,
  eb.event_id,
  eb.status
FROM event_bookings eb
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80'
AND eb.user_id NOT IN (SELECT id FROM profiles);

-- Create a profile for the missing user
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '02c99dc5-1a2b-4e42-8965-f46ac1f84858', -- The missing user_id
  'test-user@example.com', -- Placeholder email
  'user', -- Default role
  NOW(),
  NOW()
);

-- Verify the profile was created
SELECT 
  p.id,
  p.email,
  p.role,
  p.created_at
FROM profiles p
WHERE p.id = '02c99dc5-1a2b-4e42-8965-f46ac1f84858';

-- Now test the RLS query again
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









