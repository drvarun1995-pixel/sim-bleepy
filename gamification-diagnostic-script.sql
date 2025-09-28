-- Comprehensive Gamification Diagnostic Script
-- Run this script in your Supabase SQL editor to diagnose gamification issues

-- ========================================
-- 1. CHECK IF GAMIFICATION TABLES EXIST
-- ========================================
SELECT 'CHECKING GAMIFICATION TABLES' as section;

SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('user_levels', 'achievements', 'user_achievements', 'user_skills', 'user_streaks', 'xp_transactions')
  AND schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- 2. CHECK IF GAMIFICATION FUNCTIONS EXIST
-- ========================================
SELECT 'CHECKING GAMIFICATION FUNCTIONS' as section;

SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('award_xp', 'check_achievements')
ORDER BY routine_name;

-- ========================================
-- 3. CHECK USERS TABLE AND DATA
-- ========================================
SELECT 'CHECKING USERS TABLE' as section;

-- Check if users table exists and has data
SELECT 
  COUNT(*) as total_users,
  MIN(created_at) as earliest_user,
  MAX(created_at) as latest_user
FROM users;

-- Show first few users
SELECT id, email, name, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- ========================================
-- 4. CHECK ATTEMPTS TABLE AND DATA
-- ========================================
SELECT 'CHECKING ATTEMPTS TABLE' as section;

-- Check attempts table structure and data
SELECT 
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN overall_band IS NOT NULL THEN 1 END) as completed_attempts,
  COUNT(CASE WHEN scores IS NOT NULL THEN 1 END) as scored_attempts,
  MIN(created_at) as earliest_attempt,
  MAX(created_at) as latest_attempt
FROM attempts;

-- Show recent attempts with scoring data
SELECT 
  id,
  user_id,
  station_slug,
  overall_band,
  scores,
  created_at
FROM attempts 
WHERE scores IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- ========================================
-- 5. CHECK GAMIFICATION TABLES DATA
-- ========================================
SELECT 'CHECKING GAMIFICATION DATA' as section;

-- Check user_levels
SELECT 
  COUNT(*) as total_user_levels,
  COUNT(DISTINCT user_id) as unique_users_with_levels,
  SUM(total_xp) as total_xp_awarded,
  MAX(total_xp) as highest_xp
FROM user_levels;

-- Check achievements
SELECT 
  COUNT(*) as total_achievements,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_achievements,
  SUM(xp_reward) as total_xp_rewards
FROM achievements;

-- Check user_achievements
SELECT 
  COUNT(*) as total_user_achievements,
  COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_achievements
FROM user_achievements;

-- Check xp_transactions
SELECT 
  COUNT(*) as total_xp_transactions,
  SUM(xp_amount) as total_xp_awarded,
  COUNT(DISTINCT transaction_type) as unique_transaction_types,
  MIN(created_at) as earliest_transaction,
  MAX(created_at) as latest_transaction
FROM xp_transactions;

-- Show recent XP transactions
SELECT 
  user_id,
  xp_amount,
  transaction_type,
  description,
  created_at
FROM xp_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- ========================================
-- 6. CHECK RLS POLICIES
-- ========================================
SELECT 'CHECKING RLS POLICIES' as section;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_levels', 'achievements', 'user_achievements', 'user_skills', 'user_streaks', 'xp_transactions')
ORDER BY tablename, policyname;

-- ========================================
-- 7. TEST GAMIFICATION FUNCTIONS
-- ========================================
SELECT 'TESTING GAMIFICATION FUNCTIONS' as section;

-- Get a test user ID
DO $$
DECLARE
    test_user_id UUID;
    result_data JSON;
    test_attempt_count INTEGER;
BEGIN
    -- Get first user for testing
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user ID: %', test_user_id;
        
        -- Check if user has attempts
        SELECT COUNT(*) INTO test_attempt_count 
        FROM attempts 
        WHERE user_id = test_user_id AND overall_band IS NOT NULL;
        
        RAISE NOTICE 'User has % completed attempts', test_attempt_count;
        
        -- Test award_xp function
        BEGIN
            SELECT award_xp(
                test_user_id,
                50,
                'diagnostic_test',
                NULL,
                'test',
                'Diagnostic script test'
            ) INTO result_data;
            
            RAISE NOTICE 'award_xp test SUCCESS: %', result_data;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'award_xp test FAILED: %', SQLERRM;
        END;
        
        -- Test check_achievements function
        BEGIN
            PERFORM check_achievements(test_user_id);
            RAISE NOTICE 'check_achievements test SUCCESS';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'check_achievements test FAILED: %', SQLERRM;
        END;
        
        -- Show user's current level after test
        RAISE NOTICE 'Current user level: Level %, XP: %, Title: %', 
            (SELECT current_level FROM user_levels WHERE user_id = test_user_id),
            (SELECT total_xp FROM user_levels WHERE user_id = test_user_id),
            (SELECT title FROM user_levels WHERE user_id = test_user_id);
        
    ELSE
        RAISE NOTICE 'No users found in database';
    END IF;
END $$;

-- ========================================
-- 8. CHECK FUNCTION PERMISSIONS
-- ========================================
SELECT 'CHECKING FUNCTION PERMISSIONS' as section;

SELECT 
  routine_name,
  routine_type,
  security_type,
  is_deterministic,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('award_xp', 'check_achievements');

-- ========================================
-- 9. CHECK FOR MISSING DATA RELATIONSHIPS
-- ========================================
SELECT 'CHECKING DATA RELATIONSHIPS' as section;

-- Users without gamification data
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  ul.current_level,
  ul.total_xp,
  COUNT(a.id) as attempt_count
FROM users u
LEFT JOIN user_levels ul ON u.id = ul.user_id
LEFT JOIN attempts a ON u.id = a.user_id
GROUP BY u.id, u.email, u.created_at, ul.current_level, ul.total_xp, ul.user_id
HAVING ul.user_id IS NULL OR ul.total_xp = 0
ORDER BY u.created_at DESC
LIMIT 10;

-- Users with attempts but no XP
SELECT 
  u.id,
  u.email,
  COUNT(a.id) as attempt_count,
  COUNT(CASE WHEN a.overall_band IS NOT NULL THEN 1 END) as completed_attempts,
  ul.total_xp,
  COUNT(xt.id) as xp_transaction_count
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id
LEFT JOIN user_levels ul ON u.id = ul.user_id
LEFT JOIN xp_transactions xt ON u.id = xt.user_id
WHERE a.id IS NOT NULL
GROUP BY u.id, u.email, ul.total_xp
HAVING ul.total_xp = 0 OR ul.total_xp IS NULL
ORDER BY attempt_count DESC
LIMIT 10;

-- ========================================
-- 10. CHECK SCORES DATA STRUCTURE
-- ========================================
SELECT 'CHECKING SCORES DATA STRUCTURE' as section;

-- Analyze scores JSON structure
SELECT 
  id,
  user_id,
  station_slug,
  scores,
  overall_band,
  created_at
FROM attempts 
WHERE scores IS NOT NULL 
  AND jsonb_typeof(scores) = 'object'
ORDER BY created_at DESC 
LIMIT 3;

-- Check for specific score fields
SELECT 
  id,
  scores->>'totalScore' as total_score,
  scores->>'maxScore' as max_score,
  scores->>'overall_pct' as overall_percentage,
  scores->'domainScores' as domain_scores,
  overall_band
FROM attempts 
WHERE scores IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- ========================================
-- 11. SUMMARY REPORT
-- ========================================
SELECT 'SUMMARY REPORT' as section;

SELECT 
  'Users' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_records
FROM users

UNION ALL

SELECT 
  'Attempts' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_records
FROM attempts

UNION ALL

SELECT 
  'User Levels' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN updated_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_records
FROM user_levels

UNION ALL

SELECT 
  'XP Transactions' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_records
FROM xp_transactions;

-- ========================================
-- 12. RECOMMENDATIONS
-- ========================================
SELECT 'RECOMMENDATIONS' as section;

-- Check if we need to initialize users in gamification
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No gamification tables found - Run complete-gamification-setup-final.sql'
    WHEN COUNT(*) < 6 THEN '⚠️ Some gamification tables missing - Check table creation'
    ELSE '✅ All gamification tables present'
  END as table_status
FROM pg_tables 
WHERE tablename IN ('user_levels', 'achievements', 'user_achievements', 'user_skills', 'user_streaks', 'xp_transactions')
  AND schemaname = 'public';

-- Check if functions exist
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No gamification functions found - Run complete-gamification-setup-final.sql'
    WHEN COUNT(*) < 2 THEN '⚠️ Some gamification functions missing - Check function creation'
    ELSE '✅ All gamification functions present'
  END as function_status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('award_xp', 'check_achievements');

-- Check if users need initialization
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All users have gamification data'
    ELSE '⚠️ ' || COUNT(*) || ' users need gamification initialization'
  END as user_init_status
FROM users u
LEFT JOIN user_levels ul ON u.id = ul.user_id
WHERE ul.user_id IS NULL;

SELECT 'DIAGNOSTIC COMPLETE - Check the results above for issues' as final_message;