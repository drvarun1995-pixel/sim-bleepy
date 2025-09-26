-- Safe delete specific user: vt334@student.aru.ac.uk
-- This script only deletes from tables that actually exist

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

-- Delete related data (only from tables that exist)

-- Delete email verification tokens for this user (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public') THEN
        DELETE FROM email_verification_tokens 
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
        );
        RAISE NOTICE 'Deleted email verification tokens';
    ELSE
        RAISE NOTICE 'email_verification_tokens table does not exist - skipping';
    END IF;
END $$;

-- Delete password reset tokens for this user (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') THEN
        DELETE FROM password_reset_tokens 
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
        );
        RAISE NOTICE 'Deleted password reset tokens';
    ELSE
        RAISE NOTICE 'password_reset_tokens table does not exist - skipping';
    END IF;
END $$;

-- Delete user analytics for this user (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics' AND table_schema = 'public') THEN
        DELETE FROM user_analytics 
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
        );
        RAISE NOTICE 'Deleted user analytics';
    ELSE
        RAISE NOTICE 'user_analytics table does not exist - skipping';
    END IF;
END $$;

-- Delete API usage records for this user (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage' AND table_schema = 'public') THEN
        DELETE FROM api_usage 
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
        );
        RAISE NOTICE 'Deleted API usage records';
    ELSE
        RAISE NOTICE 'api_usage table does not exist - skipping';
    END IF;
END $$;

-- Delete attempts for this user (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attempts' AND table_schema = 'public') THEN
        DELETE FROM attempts 
        WHERE user_id IN (
            SELECT id FROM users WHERE email = 'vt334@student.aru.ac.uk'
        );
        RAISE NOTICE 'Deleted attempts';
    ELSE
        RAISE NOTICE 'attempts table does not exist - skipping';
    END IF;
END $$;

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
