-- Ultra-safe database check that only queries existing tables
-- This will never error on missing tables

-- First, let's see what tables actually exist
SELECT 
    'EXISTING TABLES' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Now check each table individually with proper error handling
DO $$
DECLARE
    table_exists boolean;
    row_count integer;
BEGIN
    -- Check users table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO row_count FROM users;
        RAISE NOTICE 'USERS TABLE: EXISTS - % rows', row_count;
    ELSE
        RAISE NOTICE 'USERS TABLE: NOT EXISTS';
    END IF;
    
    -- Check email_verification_tokens table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'email_verification_tokens' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO row_count FROM email_verification_tokens;
        RAISE NOTICE 'EMAIL VERIFICATION TOKENS: EXISTS - % rows', row_count;
    ELSE
        RAISE NOTICE 'EMAIL VERIFICATION TOKENS: NOT EXISTS';
    END IF;
    
    -- Check password_reset_tokens table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'password_reset_tokens' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO row_count FROM password_reset_tokens;
        RAISE NOTICE 'PASSWORD RESET TOKENS: EXISTS - % rows', row_count;
    ELSE
        RAISE NOTICE 'PASSWORD RESET TOKENS: NOT EXISTS';
    END IF;
    
    -- Check user_sessions table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_sessions' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO row_count FROM user_sessions;
        RAISE NOTICE 'USER SESSIONS: EXISTS - % rows', row_count;
    ELSE
        RAISE NOTICE 'USER SESSIONS: NOT EXISTS';
    END IF;
    
    -- Check api_usage table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'api_usage' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO row_count FROM api_usage;
        RAISE NOTICE 'API USAGE: EXISTS - % rows', row_count;
    ELSE
        RAISE NOTICE 'API USAGE: NOT EXISTS';
    END IF;
    
    -- Check user_analytics table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_analytics' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO row_count FROM user_analytics;
        RAISE NOTICE 'USER ANALYTICS: EXISTS - % rows', row_count;
    ELSE
        RAISE NOTICE 'USER ANALYTICS: NOT EXISTS';
    END IF;
    
END $$;

-- Show sample user data if users table exists
SELECT 
    'SAMPLE USER DATA' as section,
    id,
    email,
    name,
    role,
    email_verified,
    created_at
FROM users 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
LIMIT 5;
