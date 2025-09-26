-- Clear all existing users and add admin account
-- This script will remove all current users and create a new admin

-- First, let's see what we're about to delete
SELECT 'BEFORE CLEARING - Current user count:' as status;
SELECT COUNT(*) as user_count FROM users;

-- Show current users before deletion
SELECT 'CURRENT USERS:' as status;
SELECT id, email, name, role, email_verified, created_at FROM users;

-- Clear all user-related data (in correct order to avoid foreign key constraints)

-- Clear analytics data first
DELETE FROM api_usage WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage' AND table_schema = 'public');
DELETE FROM user_analytics WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics' AND table_schema = 'public');

-- Clear tokens and sessions
DELETE FROM email_verification_tokens WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public');
DELETE FROM password_reset_tokens WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public');
DELETE FROM user_sessions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public');

-- Clear users table
DELETE FROM users;

-- Verify everything is cleared
SELECT 'AFTER CLEARING - Remaining user count:' as status;
SELECT COUNT(*) as user_count FROM users;

-- Now add the admin account
-- Note: The password will be hashed by your application's auth system
INSERT INTO users (
    id,
    email,
    name,
    role,
    email_verified,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'drvarun1995@gmail.com',
    'Dr. Varun',
    'admin',
    true,
    NOW(),
    NOW()
);

-- Verify the admin account was created
SELECT 'ADMIN ACCOUNT CREATED:' as status;
SELECT id, email, name, role, email_verified, created_at FROM users WHERE email = 'drvarun1995@gmail.com';

-- Show final user count
SELECT 'FINAL USER COUNT:' as status;
SELECT COUNT(*) as user_count FROM users;

-- Reset the auto-increment sequence
SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);

SELECT 'Database cleared and admin account created successfully!' as result;
