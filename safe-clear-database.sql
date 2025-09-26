-- Safe database cleanup script
-- This script only deletes from tables that actually exist

-- Delete from email_verification_tokens (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public') THEN
        DELETE FROM email_verification_tokens;
        RAISE NOTICE 'Cleared email_verification_tokens table';
    ELSE
        RAISE NOTICE 'email_verification_tokens table does not exist';
    END IF;
END $$;

-- Delete from password_reset_tokens (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') THEN
        DELETE FROM password_reset_tokens;
        RAISE NOTICE 'Cleared password_reset_tokens table';
    ELSE
        RAISE NOTICE 'password_reset_tokens table does not exist';
    END IF;
END $$;

-- Delete from user_sessions (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') THEN
        DELETE FROM user_sessions;
        RAISE NOTICE 'Cleared user_sessions table';
    ELSE
        RAISE NOTICE 'user_sessions table does not exist';
    END IF;
END $$;

-- Delete from users (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        DELETE FROM users;
        RAISE NOTICE 'Cleared users table';
    ELSE
        RAISE NOTICE 'users table does not exist';
    END IF;
END $$;

-- Check final row counts
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count 
FROM users
UNION ALL
SELECT 
    'email_verification_tokens' as table_name, 
    COUNT(*) as row_count 
FROM email_verification_tokens
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public');
