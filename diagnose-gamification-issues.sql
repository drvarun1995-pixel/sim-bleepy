-- =====================================================
-- DIAGNOSE GAMIFICATION ISSUES
-- =====================================================
-- This script will help identify why gamification is showing zeros

-- 1. Check if gamification tables exist
SELECT 'Checking if gamification tables exist:' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'user_levels', 'achievements', 'user_achievements', 
        'user_skills', 'user_streaks', 'xp_transactions'
    )
ORDER BY tablename;

-- 2. Check if gamification functions exist
SELECT 'Checking if gamification functions exist:' as info;

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('award_xp', 'check_achievements')
ORDER BY routine_name;

-- 3. Check if user_levels table has data
SELECT 'Checking user_levels data:' as info;

SELECT COUNT(*) as total_user_levels
FROM user_levels;

-- 4. Check if any users exist
SELECT 'Checking users table:' as info;

SELECT COUNT(*) as total_users
FROM users;

-- 5. Check if attempts table has data
SELECT 'Checking attempts data:' as info;

SELECT COUNT(*) as total_attempts
FROM attempts;

-- 6. Check RLS status on gamification tables
SELECT 'RLS Status on Gamification Tables:' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'user_levels', 'achievements', 'user_achievements', 
        'user_skills', 'user_streaks', 'xp_transactions'
    )
ORDER BY tablename;

-- 7. Check if there are any policies on gamification tables
SELECT 'Policies on Gamification Tables:' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'user_levels', 'achievements', 'user_achievements', 
        'user_skills', 'user_streaks', 'xp_transactions'
    )
ORDER BY tablename, policyname;

-- 8. Test if we can query user_levels (this might fail if RLS is blocking)
SELECT 'Testing user_levels query:' as info;

SELECT 
    user_id,
    current_level,
    total_xp,
    title
FROM user_levels
LIMIT 5;

SELECT 'Diagnosis complete!' as status;
