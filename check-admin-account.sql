-- Check if admin account was created successfully
-- This script will show you the admin account details

-- Check total user count
SELECT 'TOTAL USERS IN DATABASE:' as status;
SELECT COUNT(*) as user_count FROM users;

-- Check if admin account exists
SELECT 'ADMIN ACCOUNT CHECK:' as status;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'drvarun1995@gmail.com') 
        THEN 'ADMIN ACCOUNT EXISTS' 
        ELSE 'ADMIN ACCOUNT NOT FOUND' 
    END as admin_status;

-- Show admin account details
SELECT 'ADMIN ACCOUNT DETAILS:' as status;
SELECT 
    id,
    email,
    name,
    role,
    email_verified,
    created_at,
    updated_at
FROM users 
WHERE email = 'drvarun1995@gmail.com';

-- Show all users (if any)
SELECT 'ALL USERS IN DATABASE:' as status;
SELECT 
    id,
    email,
    name,
    role,
    email_verified,
    created_at
FROM users 
ORDER BY created_at DESC;
