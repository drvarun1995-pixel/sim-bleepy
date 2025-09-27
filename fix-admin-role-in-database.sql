-- Fix admin role for drvarun1995@gmail.com in the database

-- First, check current role status
SELECT 
    email,
    name,
    role,
    created_at,
    updated_at
FROM users 
WHERE email = 'drvarun1995@gmail.com';

-- Update the admin role
UPDATE users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'drvarun1995@gmail.com';

-- Verify the update
SELECT 
    email,
    name,
    role,
    created_at,
    updated_at
FROM users 
WHERE email = 'drvarun1995@gmail.com';

-- Also check all users to see their current roles
SELECT 
    email,
    name,
    role,
    created_at
FROM users 
ORDER BY created_at DESC;
