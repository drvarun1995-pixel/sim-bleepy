-- Safe fix for user_levels initialization issue
-- This script handles existing functions gracefully

-- 1. Insert missing user_levels entries for existing users
INSERT INTO user_levels (user_id, current_level, total_xp, level_progress, title)
SELECT 
    u.id,
    1 as current_level,
    0 as total_xp,
    0.00 as level_progress,
    'Medical Student' as title
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_levels ul WHERE ul.user_id = u.id
);

-- 2. Drop existing functions first (ignore errors if they don't exist)
DROP FUNCTION IF EXISTS ensure_user_level_exists(UUID);
DROP FUNCTION IF EXISTS award_xp(UUID, INTEGER, VARCHAR(50), UUID, VARCHAR(50), TEXT);
DROP FUNCTION IF EXISTS create_user_level_on_user_insert();
DROP FUNCTION IF EXISTS initialize_all_user_levels();

-- 3. Create a function to ensure user_levels entry exists
CREATE OR REPLACE FUNCTION ensure_user_level_exists(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert user level if it doesn't exist
    INSERT INTO user_levels (user_id, current_level, total_xp, level_progress, title)
    VALUES (p_user_id, 1, 0, 0.00, 'Medical Student')
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 4. Update the award_xp function to ensure user_levels entry exists
CREATE OR REPLACE FUNCTION award_xp(
    p_user_id UUID,
    p_xp_amount INTEGER,
    p_transaction_type VARCHAR(50),
    p_source_id UUID DEFAULT NULL,
    p_source_type VARCHAR(50) DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    new_total_xp INTEGER;
    new_level INTEGER;
    new_progress DECIMAL;
    xp_for_next INTEGER;
BEGIN
    -- Ensure user_levels entry exists
    PERFORM ensure_user_level_exists(p_user_id);
    
    -- Record XP transaction
    INSERT INTO xp_transactions (user_id, xp_amount, transaction_type, source_id, source_type, description)
    VALUES (p_user_id, p_xp_amount, p_transaction_type, p_source_id, p_source_type, p_description);
    
    -- Update user level
    UPDATE user_levels 
    SET total_xp = total_xp + p_xp_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Get new level info
    SELECT ul.total_xp INTO new_total_xp FROM user_levels WHERE user_id = p_user_id;
    SELECT level, xp_for_next, progress INTO new_level, xp_for_next, new_progress 
    FROM calculate_level_from_xp(new_total_xp);
    
    -- Update level and progress
    UPDATE user_levels 
    SET current_level = new_level,
        level_progress = new_progress,
        title = CASE 
            WHEN new_level >= 10 THEN 'Consultant'
            WHEN new_level >= 7 THEN 'Senior Doctor'
            WHEN new_level >= 4 THEN 'Junior Doctor'
            ELSE 'Medical Student'
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger to automatically create user_levels entry when a user is created
CREATE OR REPLACE FUNCTION create_user_level_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_levels (user_id, current_level, total_xp, level_progress, title)
    VALUES (NEW.id, 1, 0, 0.00, 'Medical Student');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_user_level ON users;

-- Create the trigger
CREATE TRIGGER trigger_create_user_level
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_level_on_user_insert();

-- 6. Create a function to initialize all missing user levels
CREATE OR REPLACE FUNCTION initialize_all_user_levels()
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO user_levels (user_id, current_level, total_xp, level_progress, title)
    SELECT 
        u.id,
        1 as current_level,
        0 as total_xp,
        0.00 as level_progress,
        'Medical Student' as title
    FROM users u
    WHERE NOT EXISTS (
        SELECT 1 FROM user_levels ul WHERE ul.user_id = u.id
    );
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Run the initialization function
SELECT initialize_all_user_levels() as users_initialized;







