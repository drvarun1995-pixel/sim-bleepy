-- =====================================================
-- CHECK LOGIN TRACKING SETUP
-- This script checks if login tracking is properly set up
-- =====================================================

-- Check if the users table has login tracking columns
SELECT 
    'Login Tracking Columns Check' as check_name,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('last_login', 'login_count')
ORDER BY column_name;

-- Check if indexes exist for login tracking
SELECT 
    'Login Tracking Indexes Check' as check_name,
    indexname as index_name,
    indexdef as index_definition
FROM pg_indexes
WHERE tablename = 'users' 
  AND schemaname = 'public'
  AND indexname IN ('idx_users_last_login', 'idx_users_login_count')
ORDER BY indexname;

-- Check sample data (if columns exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_login'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Login tracking columns exist!';
        RAISE NOTICE '';
        RAISE NOTICE 'Sample of user login data (last 5 users):';
    ELSE
        RAISE NOTICE '❌ Login tracking columns DO NOT exist!';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 To add login tracking, run: add-login-tracking-fields.sql';
    END IF;
END $$;

-- Show sample data (only if columns exist)
SELECT 
    'User Login Sample Data' as info,
    email,
    name,
    last_login,
    login_count,
    created_at
FROM public.users
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'last_login'
    AND table_schema = 'public'
)
ORDER BY last_login DESC NULLS LAST
LIMIT 5;

-- Summary statistics (only if columns exist)
SELECT 
    'Login Tracking Summary' as summary_type,
    COUNT(*) as total_users,
    COUNT(last_login) as users_with_login_data,
    COALESCE(SUM(login_count), 0) as total_logins,
    COALESCE(AVG(login_count), 0) as avg_logins_per_user,
    MAX(last_login) as most_recent_login,
    MIN(last_login) as earliest_login
FROM public.users
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'last_login'
    AND table_schema = 'public'
);

-- =====================================================
-- RESULTS INTERPRETATION:
-- =====================================================
-- If you see columns 'last_login' and 'login_count':
--   ✅ Login tracking is SET UP
-- 
-- If you DON'T see those columns:
--   ❌ Login tracking is NOT SET UP
--   🔧 Run: add-login-tracking-fields.sql
-- =====================================================

