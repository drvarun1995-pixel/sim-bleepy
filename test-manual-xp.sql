-- Test manual XP award to verify database functions work
-- Run this in your Supabase SQL Editor

-- First, let's check if we have any users
SELECT id, email, name FROM users LIMIT 5;

-- If you have a user, replace 'USER_ID_HERE' with their actual ID
-- You can get the user ID from the query above

-- Test awarding XP manually
DO $$
DECLARE
    test_user_id UUID;
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
        SELECT current_level, total_xp, title 
        FROM user_levels 
        WHERE user_id = test_user_id;
        
    ELSE
        RAISE NOTICE 'No users found in database';
    END IF;
END $$;

