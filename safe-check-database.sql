-- Safe database check script that handles missing tables gracefully
-- This will not error if tables don't exist

-- Check all tables in the public schema
SELECT 
    'TABLE INVENTORY' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check users table safely
SELECT 
    'USERS TABLE' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
        THEN (SELECT COUNT(*)::text FROM users)
        ELSE 'N/A'
    END as row_count;

-- Check email verification tokens safely
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

-- Check password reset tokens safely
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

-- Check user sessions safely (only if table exists)
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

-- Check API usage analytics safely
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

-- Check user analytics safely
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

-- Show sample user data (only if users table exists)
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
