-- ============================================================================
-- TEST SUPABASE QUERY DIRECTLY
-- ============================================================================
-- This tests the exact query that the frontend is trying to run
-- ============================================================================

-- Test the exact query the frontend is running
SELECT 
  eb.id,
  eb.user_id,
  eb.checked_in,
  eb.status,
  u.id as user_id_from_join,
  u.name,
  u.email
FROM event_bookings eb
LEFT JOIN users u ON eb.user_id = u.id
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Check if the user exists in users table
SELECT 
  id,
  name,
  email,
  role
FROM users 
WHERE id = '02c99dc5-1a2b-4e42-8965-f46ac1f84858';

-- Check if there are any users at all
SELECT COUNT(*) as total_users FROM users;

-- Check if there are any profiles at all
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check your current user in both tables
SELECT 
  'users' as table_name,
  id,
  email,
  role
FROM users 
WHERE id = auth.uid()
UNION ALL
SELECT 
  'profiles' as table_name,
  id,
  email,
  role
FROM profiles 
WHERE id = auth.uid();










