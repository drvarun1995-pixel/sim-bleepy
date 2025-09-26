-- STEP 1: Check what exists in your database
-- Run this first to see what data you have

-- Check all tables in the public schema
SELECT 
    'TABLE INVENTORY' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if specific user-related tables exist and their row counts
SELECT 
    'USER TABLES STATUS' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as users_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
        THEN (SELECT COUNT(*)::text FROM users)
        ELSE 'N/A'
    END as users_count;

SELECT 
    'EMAIL VERIFICATION TOKENS' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens' AND table_schema = 'public') 
        THEN (SELECT COUNT(*)::text FROM email_verification_tokens)
        ELSE 'N/A'
    END as row_count;

SELECT 
    'PASSWORD RESET TOKENS' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') 
        THEN (SELECT COUNT(*)::text FROM password_reset_tokens)
        ELSE 'N/A'
    END as row_count;

SELECT 
    'USER SESSIONS' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') 
        THEN (SELECT COUNT(*)::text FROM user_sessions)
        ELSE 'N/A'
    END as row_count;

SELECT 
    'API USAGE ANALYTICS' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage' AND table_schema = 'public') 
        THEN (SELECT COUNT(*)::text FROM api_usage)
        ELSE 'N/A'
    END as row_count;

SELECT 
    'USER ANALYTICS' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics' AND table_schema = 'public') 
        THEN (SELECT COUNT(*)::text FROM user_analytics)
        ELSE 'N/A'
    END as row_count;

-- Show sample user data (if any exists)
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
