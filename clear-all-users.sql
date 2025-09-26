-- Clear all user-related data from Supabase database
-- This script will safely remove all users and related data

-- First, let's check what we're about to delete
SELECT 'BEFORE CLEARING - Current data counts:' as status;

-- Check users table
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM users)
        ELSE 0
    END as users_count;

-- Check email verification tokens
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM email_verification_tokens)
        ELSE 0
    END as email_verification_tokens_count;

-- Check password reset tokens
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM password_reset_tokens)
        ELSE 0
    END as password_reset_tokens_count;

-- Check user sessions
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM user_sessions)
        ELSE 0
    END as user_sessions_count;

-- Check analytics tables
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM api_usage)
        ELSE 0
    END as api_usage_count;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM user_analytics)
        ELSE 0
    END as user_analytics_count;

-- Now clear the data (in correct order to avoid foreign key constraints)

-- Clear analytics data first
DELETE FROM api_usage WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage' AND table_schema = 'public');
DELETE FROM user_analytics WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics' AND table_schema = 'public');

-- Clear tokens and sessions
DELETE FROM email_verification_tokens WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public');
DELETE FROM password_reset_tokens WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public');
DELETE FROM user_sessions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public');

-- Clear users table last
DELETE FROM users WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public');

-- Verify everything is cleared
SELECT 'AFTER CLEARING - Remaining data counts:' as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM users)
        ELSE 0
    END as users_count;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM email_verification_tokens)
        ELSE 0
    END as email_verification_tokens_count;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM password_reset_tokens)
        ELSE 0
    END as password_reset_tokens_count;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM user_sessions)
        ELSE 0
    END as user_sessions_count;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM api_usage)
        ELSE 0
    END as api_usage_count;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics' AND table_schema = 'public') 
        THEN (SELECT COUNT(*) FROM user_analytics)
        ELSE 0
    END as user_analytics_count;

-- Reset any auto-increment sequences if they exist
-- (This is optional but good practice)
DO $$
BEGIN
    -- Reset users table sequence if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        EXECUTE 'SELECT setval(pg_get_serial_sequence(''users'', ''id''), 1, false)';
    END IF;
END $$;

SELECT 'Database cleared successfully! All user data has been removed.' as result;
