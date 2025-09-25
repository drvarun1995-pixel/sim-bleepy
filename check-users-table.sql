-- Check what's in the users table
SELECT 
    id,
    email,
    name,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Also check the count
SELECT COUNT(*) as total_users FROM users;

-- Check if there are any profiles
SELECT COUNT(*) as total_profiles FROM profiles;
