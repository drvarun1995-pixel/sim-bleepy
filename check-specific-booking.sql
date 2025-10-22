-- Check the specific booking data
SELECT 
  id,
  event_id,
  user_id,
  status,
  checked_in,
  booked_at
FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Check if the user from the booking exists in users table
SELECT 
  id,
  name,
  email,
  role
FROM users 
WHERE id = '02c99dc5-1a2b-4e42-8965-f46ac1f84858';

-- Test the exact query the frontend is trying to run
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









