-- Safe clear all users and add admin account
-- This script only deletes from tables that actually exist

-- First, let's see what we're about to delete
SELECT 'BEFORE CLEARING - Current user count:' as status;
SELECT COUNT(*) as user_count FROM users;

-- Show current users before deletion
SELECT 'CURRENT USERS:' as status;
SELECT id, email, name, role, email_verified, created_at FROM users;

-- Clear user-related data (only from tables that exist)

-- Clear analytics data if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage' AND table_schema = 'public') THEN
        DELETE FROM api_usage;
        RAISE NOTICE 'Cleared api_usage table';
    ELSE
        RAISE NOTICE 'api_usage table does not exist - skipping';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics' AND table_schema = 'public') THEN
        DELETE FROM user_analytics;
        RAISE NOTICE 'Cleared user_analytics table';
    ELSE
        RAISE NOTICE 'user_analytics table does not exist - skipping';
    END IF;
END $$;

-- Clear tokens and sessions if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public') THEN
        DELETE FROM email_verification_tokens;
        RAISE NOTICE 'Cleared email_verification_tokens table';
    ELSE
        RAISE NOTICE 'email_verification_tokens table does not exist - skipping';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') THEN
        DELETE FROM password_reset_tokens;
        RAISE NOTICE 'Cleared password_reset_tokens table';
    ELSE
        RAISE NOTICE 'password_reset_tokens table does not exist - skipping';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') THEN
        DELETE FROM user_sessions;
        RAISE NOTICE 'Cleared user_sessions table';
    ELSE
        RAISE NOTICE 'user_sessions table does not exist - skipping';
    END IF;
END $$;

-- Clear users table (this should exist)
DELETE FROM users;

-- Verify everything is cleared
SELECT 'AFTER CLEARING - Remaining user count:' as status;
SELECT COUNT(*) as user_count FROM users;

-- Now add the admin account
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

-- Reset the auto-increment sequence if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        PERFORM setval(pg_get_serial_sequence('users', 'id'), 1, false);
        RAISE NOTICE 'Reset users table sequence';
    END IF;
END $$;

SELECT 'Database cleared and admin account created successfully!' as result;
