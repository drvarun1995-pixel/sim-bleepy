-- Delete user varun.tyagi@nhs.net and all associated data
-- This script will safely remove the user from all related tables

-- First, let's check what data exists for this user
SELECT 
    'Checking user data...' as status,
    (SELECT COUNT(*) FROM users WHERE email = 'varun.tyagi@nhs.net') as users_count,
    (SELECT COUNT(*) FROM attempts WHERE user_id IN (SELECT id FROM users WHERE email = 'varun.tyagi@nhs.net')) as attempts_count,
    (SELECT COUNT(*) FROM email_verification_tokens WHERE user_id IN (SELECT id FROM users WHERE email = 'varun.tyagi@nhs.net')) as verification_tokens_count,
    (SELECT COUNT(*) FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email = 'varun.tyagi@nhs.net')) as reset_tokens_count;

-- Get the user ID for reference
SELECT 
    id,
    email,
    name,
    created_at,
    email_verified,
    consent_given,
    marketing_consent,
    analytics_consent
FROM users 
WHERE email = 'varun.tyagi@nhs.net';

-- Delete user data from all related tables (using DO blocks for safety)

-- Delete from attempts table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attempts' AND table_schema = 'public') THEN
        DELETE FROM attempts
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'varun.tyagi@nhs.net'
        );
        RAISE NOTICE 'Deleted user attempts';
    ELSE
        RAISE NOTICE 'attempts table does not exist - skipping';
    END IF;
END $$;

-- Delete from user analytics table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics' AND table_schema = 'public') THEN
        DELETE FROM user_analytics
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'varun.tyagi@nhs.net'
        );
        RAISE NOTICE 'Deleted user analytics';
    ELSE
        RAISE NOTICE 'user_analytics table does not exist - skipping';
    END IF;
END $$;

-- Delete from API usage table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage' AND table_schema = 'public') THEN
        DELETE FROM api_usage
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'varun.tyagi@nhs.net'
        );
        RAISE NOTICE 'Deleted API usage data';
    ELSE
        RAISE NOTICE 'api_usage table does not exist - skipping';
    END IF;
END $$;

-- Delete from email verification tokens
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public') THEN
        DELETE FROM email_verification_tokens
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'varun.tyagi@nhs.net'
        );
        RAISE NOTICE 'Deleted email verification tokens';
    ELSE
        RAISE NOTICE 'email_verification_tokens table does not exist - skipping';
    END IF;
END $$;

-- Delete from password reset tokens
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') THEN
        DELETE FROM password_reset_tokens
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'varun.tyagi@nhs.net'
        );
        RAISE NOTICE 'Deleted password reset tokens';
    ELSE
        RAISE NOTICE 'password_reset_tokens table does not exist - skipping';
    END IF;
END $$;

-- Delete from profiles table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        DELETE FROM profiles
        WHERE id IN (
            SELECT id FROM users WHERE email = 'varun.tyagi@nhs.net'
        );
        RAISE NOTICE 'Deleted profile data';
    ELSE
        RAISE NOTICE 'profiles table does not exist - skipping';
    END IF;
END $$;

-- Finally, delete the user record
DELETE FROM users 
WHERE email = 'varun.tyagi@nhs.net';

-- Verify deletion
SELECT 
    'Deletion complete' as status,
    (SELECT COUNT(*) FROM users WHERE email = 'varun.tyagi@nhs.net') as remaining_users,
    'User varun.tyagi@nhs.net has been completely removed' as message;
