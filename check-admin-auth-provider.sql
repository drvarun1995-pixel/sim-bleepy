-- Check the auth_provider for the admin account
SELECT 
    id,
    email,
    name,
    auth_provider,
    email_verified,
    created_at
FROM users 
WHERE email = 'drvarun1995@gmail.com';
