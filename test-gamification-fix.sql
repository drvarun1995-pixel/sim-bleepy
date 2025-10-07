-- =====================================================
-- TEST GAMIFICATION FIX
-- =====================================================
-- This script tests if the gamification system is working

-- 1. Check if all gamification tables exist and have data
SELECT 'Checking gamification tables:' as info;

SELECT 
    'user_levels' as table_name,
    COUNT(*) as record_count
FROM user_levels
UNION ALL
SELECT 
    'achievements' as table_name,
    COUNT(*) as record_count
FROM achievements
UNION ALL
SELECT 
    'user_achievements' as table_name,
    COUNT(*) as record_count
FROM user_achievements
UNION ALL
SELECT 
    'user_skills' as table_name,
    COUNT(*) as record_count
FROM user_skills
UNION ALL
SELECT 
    'user_streaks' as table_name,
    COUNT(*) as record_count
FROM user_streaks
UNION ALL
SELECT 
    'xp_transactions' as table_name,
    COUNT(*) as record_count
FROM xp_transactions;

-- 2. Check if users have been initialized in the gamification system
SELECT 'User levels data:' as info;

SELECT 
    u.email,
    ul.current_level,
    ul.total_xp,
    ul.title
FROM users u
LEFT JOIN user_levels ul ON u.id = ul.user_id
ORDER BY ul.total_xp DESC
LIMIT 5;

-- 3. Check achievements data
SELECT 'Achievements data:' as info;

SELECT 
    code,
    name,
    category,
    color,
    xp_reward
FROM achievements
ORDER BY xp_reward DESC;

-- 4. Check RLS status on gamification tables
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

-- 5. Test if we can query user levels (this should work now)
SELECT 'Testing user levels query:' as info;

SELECT 
    COUNT(*) as total_users_with_levels,
    AVG(current_level) as average_level,
    AVG(total_xp) as average_xp
FROM user_levels;

-- 6. Check if there are any attempts in the system
SELECT 'Checking attempts data:' as info;

SELECT 
    COUNT(*) as total_attempts,
    COUNT(DISTINCT user_id) as unique_users_with_attempts
FROM attempts;

SELECT 'Gamification test complete!' as status;
