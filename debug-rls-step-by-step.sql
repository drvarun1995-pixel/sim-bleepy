-- ============================================================================
-- DEBUG RLS STEP BY STEP
-- ============================================================================

-- Step 1: Check your current user and role
SELECT 
  auth.uid() as current_user_id,
  p.email,
  p.role,
  CASE 
    WHEN p.role IN ('admin', 'meded_team', 'ctf', 'educator', 'staff') 
    THEN '✅ You have admin access'
    ELSE '❌ You are regular user'
  END as access_status
FROM profiles p
WHERE p.id = auth.uid();

-- Step 2: Check what bookings exist for your event
SELECT 
  eb.id,
  eb.event_id,
  eb.user_id,
  eb.status,
  eb.checked_in
FROM event_bookings eb
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Step 3: Check if you can see the booking with RLS (this should work if you're admin)
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

-- Step 4: Check if the user from the booking exists in users table
SELECT id, name, email FROM users LIMIT 5;

-- Step 5: Check if the user from the booking exists in profiles table
SELECT id, email, role FROM profiles LIMIT 5;










