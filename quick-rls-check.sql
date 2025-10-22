-- Quick RLS check - test if you can see the booking
SELECT 
  id,
  event_id,
  user_id,
  status,
  checked_in
FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Check if you're logged in as admin
SELECT 
  auth.uid() as current_user,
  CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') 
    THEN 'Admin in users table'
    ELSE 'Not admin in users table'
  END as users_table_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') 
    THEN 'Admin in profiles table'
    ELSE 'Not admin in profiles table'
  END as profiles_table_check;









