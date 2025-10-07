-- =====================================================
-- FIX GAMIFICATION TRIGGERS
-- =====================================================
-- This script creates functions to automatically update gamification when attempts are completed

-- 1. Create function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    last_activity_date DATE;
    current_date DATE := CURRENT_DATE;
    streak_days INTEGER := 0;
    existing_streak RECORD;
BEGIN
    -- Get the most recent attempt date for this user
    SELECT MAX(DATE(start_time)) INTO last_activity_date
    FROM attempts 
    WHERE user_id = p_user_id;
    
    -- If no attempts, set streak to 0
    IF last_activity_date IS NULL THEN
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date)
        VALUES (p_user_id, 'daily_practice', 0, 0, NULL, NULL)
        ON CONFLICT (user_id, streak_type) DO UPDATE SET
            current_streak = 0,
            last_activity_date = NULL,
            updated_at = NOW();
        RETURN;
    END IF;
    
    -- Get existing streak data
    SELECT * INTO existing_streak
    FROM user_streaks 
    WHERE user_id = p_user_id AND streak_type = 'daily_practice';
    
    -- Calculate streak
    IF existing_streak.last_activity_date IS NULL THEN
        -- First time, start streak
        streak_days := 1;
    ELSIF existing_streak.last_activity_date = current_date - INTERVAL '1 day' THEN
        -- Consecutive day, increment streak
        streak_days := existing_streak.current_streak + 1;
    ELSIF existing_streak.last_activity_date = current_date THEN
        -- Same day, keep current streak
        streak_days := existing_streak.current_streak;
    ELSE
        -- Streak broken, reset to 1
        streak_days := 1;
    END IF;
    
    -- Update or insert streak
    INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date)
    VALUES (
        p_user_id, 
        'daily_practice', 
        streak_days, 
        GREATEST(COALESCE(existing_streak.longest_streak, 0), streak_days),
        current_date,
        CASE WHEN streak_days = 1 AND existing_streak.last_activity_date != current_date THEN current_date ELSE existing_streak.streak_start_date END
    )
    ON CONFLICT (user_id, streak_type) DO UPDATE SET
        current_streak = streak_days,
        longest_streak = GREATEST(user_streaks.longest_streak, streak_days),
        last_activity_date = current_date,
        streak_start_date = CASE WHEN streak_days = 1 AND user_streaks.last_activity_date != current_date THEN current_date ELSE user_streaks.streak_start_date END,
        updated_at = NOW();
END;
$$;

-- 2. Create function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_attempts INTEGER;
    user_perfect_scores INTEGER;
    user_streak_days INTEGER;
    user_total_xp INTEGER;
BEGIN
    -- Get user statistics
    SELECT COUNT(*) INTO user_attempts
    FROM attempts 
    WHERE user_id = p_user_id AND overall_band IS NOT NULL;
    
    SELECT COUNT(*) INTO user_perfect_scores
    FROM attempts 
    WHERE user_id = p_user_id 
    AND scores::json->>'totalScore' = '12';
    
    SELECT current_streak INTO user_streak_days
    FROM user_streaks 
    WHERE user_id = p_user_id AND streak_type = 'daily_practice';
    
    SELECT total_xp INTO user_total_xp
    FROM user_levels 
    WHERE user_id = p_user_id;
    
    -- Check and award achievements
    -- First scenario
    IF user_attempts >= 1 THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'first_scenario'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
    
    -- Perfect score
    IF user_perfect_scores >= 1 THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'perfect_score'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
    
    -- Scenario master (50 scenarios)
    IF user_attempts >= 50 THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'scenario_master'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
    
    -- Perfectionist (10 perfect scores)
    IF user_perfect_scores >= 10 THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'perfectionist'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
    
    -- Week warrior (7 day streak)
    IF COALESCE(user_streak_days, 0) >= 7 THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'week_warrior'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
    
    -- Month master (30 day streak)
    IF COALESCE(user_streak_days, 0) >= 30 THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'month_master'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
    
    -- Speed demon (under 5 minutes)
    IF EXISTS (
        SELECT 1 FROM attempts 
        WHERE user_id = p_user_id 
        AND duration < 300 
        AND overall_band IS NOT NULL
    ) THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'speed_demon'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
    
    -- Early bird (before 8 AM)
    IF EXISTS (
        SELECT 1 FROM attempts 
        WHERE user_id = p_user_id 
        AND EXTRACT(HOUR FROM start_time) < 8
        AND overall_band IS NOT NULL
    ) THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'early_bird'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
    
    -- Night owl (after 10 PM)
    IF EXISTS (
        SELECT 1 FROM attempts 
        WHERE user_id = p_user_id 
        AND EXTRACT(HOUR FROM start_time) >= 22
        AND overall_band IS NOT NULL
    ) THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'night_owl'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
    
    -- Weekend warrior (both weekend days)
    IF EXISTS (
        SELECT 1 FROM attempts 
        WHERE user_id = p_user_id 
        AND EXTRACT(DOW FROM start_time) IN (0, 6) -- Sunday = 0, Saturday = 6
        AND overall_band IS NOT NULL
        GROUP BY DATE(start_time)
        HAVING COUNT(DISTINCT EXTRACT(DOW FROM start_time)) = 2
    ) THEN
        INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at)
        SELECT p_user_id, id, true, NOW()
        FROM achievements 
        WHERE code = 'weekend_warrior'
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        );
    END IF;
END;
$$;

-- 3. Create main function to update all gamification data
CREATE OR REPLACE FUNCTION update_gamification_on_attempt_completion(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update user streak
    PERFORM update_user_streak(p_user_id);
    
    -- Check and award achievements
    PERFORM check_and_award_achievements(p_user_id);
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION update_user_streak TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION update_gamification_on_attempt_completion TO authenticated;

-- 5. Test the functions with existing data
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the first user ID for testing
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing gamification triggers with user: %', test_user_id;
        
        -- Update streak
        PERFORM update_user_streak(test_user_id);
        RAISE NOTICE 'Streak updated';
        
        -- Check achievements
        PERFORM check_and_award_achievements(test_user_id);
        RAISE NOTICE 'Achievements checked';
        
        -- Show results
        RAISE NOTICE 'Streak data: %', (
            SELECT 
                current_streak || ' days, longest: ' || longest_streak || ', last activity: ' || last_activity_date
            FROM user_streaks 
            WHERE user_id = test_user_id AND streak_type = 'daily_practice'
        );
        
        RAISE NOTICE 'Achievements earned: %', (
            SELECT COUNT(*)::text
            FROM user_achievements 
            WHERE user_id = test_user_id AND is_completed = true
        );
        
    ELSE
        RAISE NOTICE 'No users found in database';
    END IF;
END $$;

SELECT 'Gamification triggers created successfully!' as status;
SELECT 'Now update your attempts API to call update_gamification_on_attempt_completion()' as note;
