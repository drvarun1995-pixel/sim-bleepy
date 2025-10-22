-- Debug analytics API issues
-- Check if there are RLS policies blocking user queries

-- Check total users count
SELECT COUNT(*) as total_users FROM users;

-- Check users by role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- Check if specific user exists
SELECT id, email, name, role, created_at, email_verified
FROM users 
WHERE email = 'VT334@student.aru.ac.uk';

-- Check recent users
SELECT id, email, name, role, created_at, email_verified
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- Test direct query (this should work with service role)
SELECT id, email, name, role, created_at, email_verified
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

