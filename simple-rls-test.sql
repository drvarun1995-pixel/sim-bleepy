-- ============================================================================
-- SIMPLE RLS TEST - DIRECT APPROACH
-- ============================================================================

-- Test 1: Check if you can see the booking at all (without joins)
SELECT 
  id,
  event_id,
  user_id,
  status,
  checked_in
FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Test 2: Check your current user's role in users table
SELECT 
  id,
  email,
  role
FROM users 
WHERE id = auth.uid();

-- Test 3: Check your current user's role in profiles table
SELECT 
  id,
  email,
  role
FROM profiles 
WHERE id = auth.uid();

-- Test 4: Check if the booking user exists in users table
SELECT 
  id,
  name,
  email,
  role
FROM users 
WHERE id = '02c99dc5-1a2b-4e42-8965-f46ac1f84858';

-- Test 5: Simple admin check - can you see all bookings?
SELECT COUNT(*) as total_bookings FROM event_bookings;

-- Test 6: Check what the frontend query should return
SELECT 
  eb.id,
  eb.event_id,
  eb.user_id,
  eb.checked_in,
  eb.status,
  u.id as user_table_id,
  u.name,
  u.email
FROM event_bookings eb
LEFT JOIN users u ON eb.user_id = u.id
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';










