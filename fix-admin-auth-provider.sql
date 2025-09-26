-- Fix the auth_provider for the admin account
UPDATE users 
SET 
    auth_provider = 'email',
    email_verified = true,
    updated_at = NOW()
WHERE email = 'drvarun1995@gmail.com';

-- Verify the update
SELECT 
    id,
    email,
    name,
    auth_provider,
    email_verified,
    updated_at
FROM users 
WHERE email = 'drvarun1995@gmail.com';
