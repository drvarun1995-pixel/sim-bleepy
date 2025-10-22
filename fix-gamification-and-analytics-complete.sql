-- =====================================================
-- COMPREHENSIVE FIX FOR GAMIFICATION AND ANALYTICS
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Part 1: Check Current State
-- =====================================================

-- Check if gamification tables exist
DO $$ 
BEGIN
  RAISE NOTICE 'Checking gamification tables...';
END $$;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('user_levels'),
    ('xp_transactions'),
    ('achievements'),
    ('user_achievements'),
    ('user_streaks'),
    ('challenges'),
    ('user_challenges'),
    ('leaderboard_entries')
) AS t(table_name);

-- Check if gamification functions exist
SELECT 
  proname as function_name,
  CASE 
    WHEN proname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_proc 
WHERE proname IN ('award_xp', 'update_gamification_on_attempt_completion', 'check_achievements')
ORDER BY proname;

-- Part 2: Create Missing Functions
-- =====================================================

-- Function to award XP (adapted to actual schema)
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_transaction_type VARCHAR DEFAULT 'manual',
  p_source_id UUID DEFAULT NULL,
  p_source_type VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Log the XP award attempt
  RAISE NOTICE 'Awarding % XP to user %', p_xp_amount, p_user_id;

  -- Ensure user has a level record (using only columns that exist)
  INSERT INTO user_levels (user_id, current_level, total_xp, title)
  VALUES (p_user_id, 1, 0, 'Medical Student')
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current XP and level
  SELECT COALESCE(total_xp, 0), COALESCE(current_level, 1)
  INTO v_current_xp, v_current_level
  FROM user_levels 
  WHERE user_id = p_user_id;

  -- Calculate new XP
  v_new_xp := v_current_xp + p_xp_amount;
  
  -- Simple level calculation: 100 XP per level
  v_new_level := FLOOR(v_new_xp / 100) + 1;

  -- Update user level (only update columns that exist)
  UPDATE user_levels
  SET 
    total_xp = v_new_xp,
    current_level = v_new_level,
    title = CASE
      WHEN v_new_level >= 20 THEN 'Consultant'
      WHEN v_new_level >= 15 THEN 'Registrar'
      WHEN v_new_level >= 10 THEN 'Senior House Officer'
      WHEN v_new_level >= 5 THEN 'Foundation Doctor'
      ELSE 'Medical Student'
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record XP transaction
  INSERT INTO xp_transactions (
    user_id,
    xp_amount,
    transaction_type,
    source_id,
    source_type,
    description
  ) VALUES (
    p_user_id,
    p_xp_amount,
    p_transaction_type,
    p_source_id,
    p_source_type,
    p_description
  );

  RAISE NOTICE 'XP awarded successfully. New total: % (Level %)', v_new_xp, v_new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update gamification on attempt completion
CREATE OR REPLACE FUNCTION update_gamification_on_attempt_completion(
  p_user_id UUID
) RETURNS void AS $$
DECLARE
  v_today DATE;
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  v_today := CURRENT_DATE;

  -- Update daily streak
  SELECT last_activity_date, current_streak
  INTO v_last_activity, v_current_streak
  FROM user_streaks
  WHERE user_id = p_user_id AND streak_type = 'daily_practice';

  IF v_last_activity IS NULL THEN
    -- First streak
    v_new_streak := 1;
  ELSIF v_last_activity = v_today THEN
    -- Same day, keep streak
    v_new_streak := v_current_streak;
  ELSIF v_last_activity = v_today - INTERVAL '1 day' THEN
    -- Consecutive day
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken
    v_new_streak := 1;
  END IF;

  -- Upsert streak record
  INSERT INTO user_streaks (
    user_id,
    streak_type,
    current_streak,
    longest_streak,
    last_activity_date,
    streak_start_date
  ) VALUES (
    p_user_id,
    'daily_practice',
    v_new_streak,
    GREATEST(v_new_streak, COALESCE(v_current_streak, 0)),
    v_today,
    v_today
  )
  ON CONFLICT (user_id, streak_type) 
  DO UPDATE SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(user_streaks.longest_streak, v_new_streak),
    last_activity_date = v_today,
    streak_start_date = CASE 
      WHEN v_new_streak = 1 THEN v_today 
      ELSE user_streaks.streak_start_date 
    END,
    updated_at = NOW();

  -- Award streak bonuses
  IF v_new_streak = 7 THEN
    PERFORM award_xp(p_user_id, 300, 'streak_bonus', NULL, NULL, '7-day practice streak!');
  ELSIF v_new_streak = 30 THEN
    PERFORM award_xp(p_user_id, 1000, 'streak_bonus', NULL, NULL, '30-day practice streak!');
  END IF;

  RAISE NOTICE 'Gamification updated. Streak: %', v_new_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check achievements
CREATE OR REPLACE FUNCTION check_achievements(
  p_user_id UUID
) RETURNS void AS $$
DECLARE
  v_total_attempts INTEGER;
  v_completed_attempts INTEGER;
BEGIN
  -- Count attempts
  SELECT COUNT(*) INTO v_total_attempts
  FROM attempts WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_completed_attempts
  FROM attempts WHERE user_id = p_user_id AND overall_band IS NOT NULL;

  -- Check for "First Scenario" achievement
  IF v_total_attempts = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id, is_completed)
    SELECT p_user_id, id, true
    FROM achievements
    WHERE code = 'first_scenario' AND is_active = true
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;

  -- Check for "Scenario Master" achievement (50 attempts)
  IF v_total_attempts >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_id, is_completed)
    SELECT p_user_id, id, true
    FROM achievements
    WHERE code = 'scenario_master' AND is_active = true
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;

  RAISE NOTICE 'Achievement check complete. Total attempts: %', v_total_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 3: Grant Execute Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION award_xp(UUID, INTEGER, VARCHAR, UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION award_xp(UUID, INTEGER, VARCHAR, UUID, VARCHAR, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_gamification_on_attempt_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_gamification_on_attempt_completion(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION check_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_achievements(UUID) TO service_role;

-- Part 4: Verify Everything Works
-- =====================================================

-- Test the award_xp function (replace with your actual user ID)
DO $$ 
DECLARE
  v_test_user_id UUID;
BEGIN
  -- Get a test user (first user in the system)
  SELECT id INTO v_test_user_id FROM users LIMIT 1;
  
  IF v_test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing award_xp for user: %', v_test_user_id;
    PERFORM award_xp(v_test_user_id, 50, 'test', NULL, NULL, 'Test XP award');
    RAISE NOTICE 'Test successful!';
  ELSE
    RAISE NOTICE 'No users found to test with';
  END IF;
END $$;

-- Check results
SELECT 
  u.email,
  ul.total_xp,
  ul.current_level,
  ul.title,
  COUNT(xt.id) as xp_transaction_count
FROM users u
LEFT JOIN user_levels ul ON u.id = ul.user_id
LEFT JOIN xp_transactions xt ON u.id = xt.user_id
GROUP BY u.id, u.email, ul.total_xp, ul.current_level, ul.title
ORDER BY ul.total_xp DESC NULLS LAST
LIMIT 10;

-- =====================================================
-- FINAL MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ GAMIFICATION FUNCTIONS CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  - award_xp()';
  RAISE NOTICE '  - update_gamification_on_attempt_completion()';
  RAISE NOTICE '  - check_achievements()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Complete a scenario on the live site';
  RAISE NOTICE '2. Check if XP updates in dashboard/gamification';
  RAISE NOTICE '3. Check browser console for "✅ XP awarded" messages';
  RAISE NOTICE '========================================';
END $$;

