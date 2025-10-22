-- ============================================================================
-- TEST RLS DIRECTLY
-- ============================================================================

-- Test 1: Check if you can see the booking without any joins
SELECT 
  id,
  event_id,
  user_id,
  status,
  checked_in
FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Test 2: Check if the user_id from the booking exists in users table
SELECT 
  eb.user_id as booking_user_id,
  u.id as users_table_id,
  u.name,
  u.email
FROM event_bookings eb
LEFT JOIN users u ON eb.user_id = u.id
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Test 3: Check if the user_id from the booking exists in profiles table
SELECT 
  eb.user_id as booking_user_id,
  p.id as profiles_table_id,
  p.email,
  p.role
FROM event_bookings eb
LEFT JOIN profiles p ON eb.user_id = p.id
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';










