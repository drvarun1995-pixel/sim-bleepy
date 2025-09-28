-- Fix the award_xp function to resolve ambiguous column reference
-- Run this in your Supabase SQL Editor

-- Drop and recreate the award_xp function with fixed variable names
DROP FUNCTION IF EXISTS award_xp(UUID, INTEGER, VARCHAR, UUID, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION award_xp(
    p_user_id UUID,
    p_xp_amount INTEGER,
    p_transaction_type VARCHAR,
    p_source_id UUID DEFAULT NULL,
    p_source_type VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    current_user_level INTEGER;
    current_user_xp INTEGER;
    new_user_level INTEGER;
    xp_remaining INTEGER;
BEGIN
    -- Get current level and XP
    SELECT COALESCE(current_level, 1), COALESCE(total_xp, 0)
    INTO current_user_level, current_user_xp
    FROM user_levels 
    WHERE user_id = p_user_id;
    
    -- If user doesn't exist in user_levels, create them
    IF NOT FOUND THEN
        INSERT INTO user_levels (user_id, current_level, total_xp, level_progress, title, created_at, updated_at)
        VALUES (p_user_id, 1, 0, 0, 'Medical Student', NOW(), NOW());
        current_user_level := 1;
        current_user_xp := 0;
    END IF;
    
    -- Add XP
    current_user_xp := current_user_xp + p_xp_amount;
    
    -- Calculate new level (100 XP per level)
    new_user_level := current_user_level;
    xp_remaining := current_user_xp;
    
    WHILE xp_remaining >= 100 LOOP
        xp_remaining := xp_remaining - 100;
        new_user_level := new_user_level + 1;
    END LOOP;
    
    -- Update level if changed
    IF new_user_level > current_user_level THEN
        UPDATE user_levels SET
            current_level = new_user_level,
            level_progress = (xp_remaining::DECIMAL / 100) * 100,
            title = CASE 
                WHEN new_user_level >= 20 THEN 'Medical Professor'
                WHEN new_user_level >= 15 THEN 'Senior Consultant'
                WHEN new_user_level >= 10 THEN 'Consultant'
                WHEN new_user_level >= 5 THEN 'Registrar'
                WHEN new_user_level >= 3 THEN 'Junior Doctor'
                ELSE 'Medical Student'
            END,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        -- Update progress for current level
        UPDATE user_levels SET
            level_progress = (xp_remaining::DECIMAL / 100) * 100,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Update total XP
    UPDATE user_levels SET
        total_xp = current_user_xp,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log the XP transaction
    INSERT INTO xp_transactions (
        user_id, xp_amount, transaction_type, source_id, source_type, description, created_at
    ) VALUES (
        p_user_id, p_xp_amount, p_transaction_type, p_source_id, p_source_type, p_description, NOW()
    );
    
    -- Check for achievements
    PERFORM check_achievements(p_user_id);
    
END;
$$ LANGUAGE plpgsql;

-- Test the fixed function (simplified)
DO $$
DECLARE
    test_user_id UUID;
    result_record RECORD;
BEGIN
    -- Get the first user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Award 100 XP to test the system
        PERFORM award_xp(
            test_user_id,
            100,
            'test_completion',
            NULL,
            'test',
            'Manual test XP award'
        );
        
        RAISE NOTICE 'Test XP awarded to user: %', test_user_id;
        
        -- Check the result
        SELECT total_xp, current_level, title 
        INTO result_record
        FROM user_levels 
        WHERE user_id = test_user_id;
        
        RAISE NOTICE 'Result: Level %, XP %, Title: %', 
            result_record.current_level, 
            result_record.total_xp, 
            result_record.title;
        
    ELSE
        RAISE NOTICE 'No users found in database';
    END IF;
END $$;
