-- Delete specific user: vt334@student.aru.ac.uk
-- This script will safely remove the user and all related data

-- First, let's check if the user exists
SELECT 
    'CHECKING USER EXISTS' as status,
    id,
    email,
    name,
    role,
    email_verified,
    created_at
FROM users 
WHERE email = 'vt334@student.aru.ac.uk';

-- Delete related data first (to avoid foreign key constraints)

-- Delete email verification tokens for this user
DELETE FROM email_verification_tokens 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
);

-- Delete password reset tokens for this user
DELETE FROM password_reset_tokens 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
);

-- Delete user analytics for this user
DELETE FROM user_analytics 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
);

-- Delete API usage records for this user
DELETE FROM api_usage 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
);

-- Delete attempts for this user
DELETE FROM attempts 
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
);

-- Finally, delete the user
DELETE FROM users 
WHERE email = 'vt334@student.aru.ac.uk';

-- Verify the user has been deleted
SELECT 
    'VERIFICATION - USER DELETED' as status,
    COUNT(*) as remaining_users_with_email
FROM users 
WHERE email = 'vt334@student.aru.ac.uk';

-- Show remaining users
SELECT 
    'REMAINING USERS' as status,
    id,
    email,
    name,
    role,
    email_verified,
    created_at
FROM users 
ORDER BY created_at DESC;
