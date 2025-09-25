-- Comprehensive database check script

-- 1. Check if users table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled on users table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- 3. Check for any RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Count users
SELECT COUNT(*) as total_users FROM users;

-- 5. Show sample users
SELECT id, email, name, created_at FROM users LIMIT 10;

-- 6. Check if there are any profiles (in case users are stored there)
SELECT COUNT(*) as total_profiles FROM profiles;

-- 7. Check attempts table
SELECT COUNT(*) as total_attempts FROM attempts;

-- 8. Check stations table
SELECT COUNT(*) as total_stations FROM stations;
SELECT slug, title FROM stations;
