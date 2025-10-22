-- Debug analytics user filtering issue
-- Check total users in database
SELECT COUNT(*) as total_users FROM users;

-- Check users with different roles
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- Check if any users are missing email_verified or have null values
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN email_verified IS NULL THEN 1 END) as null_email_verified,
  COUNT(CASE WHEN email_verified = false THEN 1 END) as false_email_verified,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as true_email_verified
FROM users;

-- Check specific user mentioned (VT334@student.aru.ac.uk)
SELECT id, email, name, role, email_verified, created_at, last_login
FROM users 
WHERE email = 'VT334@student.aru.ac.uk';

-- Check recent users
SELECT id, email, name, role, email_verified, created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

