-- Debug script to check users table and RLS policies

-- Check if RLS is enabled on users table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Check users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if there are any RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Simple count query
SELECT COUNT(*) as user_count FROM users;

-- Check actual data
SELECT id, email, name, created_at FROM users LIMIT 5;
