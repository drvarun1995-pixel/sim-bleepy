-- Safe Gamification Database Schema
-- This script safely creates gamification tables and data without conflicts

-- 1. User levels and progression
CREATE TABLE IF NOT EXISTS user_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL DEFAULT 1,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    title VARCHAR(50) DEFAULT 'Medical Student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '🏆',
    category VARCHAR(50) NOT NULL,
    xp_reward INTEGER DEFAULT 100,
    badge_color VARCHAR(20) DEFAULT '#FFD700',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    UNIQUE(user_id, achievement_id)
);

-- 4. Skill tracking
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(50) NOT NULL,
    skill_level INTEGER NOT NULL DEFAULT 1,
    skill_xp INTEGER NOT NULL DEFAULT 0,
    level_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- 5. Streak tracking
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL DEFAULT 'daily_practice',
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    streak_start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- 6. XP transactions log
CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    source_id UUID,
    source_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert achievements safely (only if they don't exist)
INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('first_scenario', 'First Steps', 'Complete your first medical scenario', '🎯', 'completion', 100, '#4CAF50')
ON CONFLICT (code) DO NOTHING;

INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('perfect_score', 'Perfectionist', 'Achieve a perfect score (95%+) on any scenario', '⭐', 'skill', 200, '#FFD700')
ON CONFLICT (code) DO NOTHING;

INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('speed_demon', 'Speed Demon', 'Complete a scenario in under 5 minutes', '⚡', 'skill', 150, '#FF6B35')
ON CONFLICT (code) DO NOTHING;

INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('scenario_master', 'Scenario Master', 'Complete 50 medical scenarios', '🏆', 'completion', 500, '#9C27B0')
ON CONFLICT (code) DO NOTHING;

INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('perfectionist', 'Perfectionist', 'Achieve perfect scores on 10 scenarios', '💎', 'skill', 600, '#E91E63')
ON CONFLICT (code) DO NOTHING;

INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('dedicated_learner', 'Dedicated Learner', 'Practice for 7 consecutive days', '📚', 'social', 300, '#2196F3')
ON CONFLICT (code) DO NOTHING;

INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('marathon_practitioner', 'Marathon Practitioner', 'Practice for 30 consecutive days', '🏃', 'social', 1000, '#FF9800')
ON CONFLICT (code) DO NOTHING;

INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('diagnosis_expert', 'Diagnosis Expert', 'Correctly diagnose 25 scenarios', '🔍', 'skill', 400, '#795548')
ON CONFLICT (code) DO NOTHING;

INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('communication_master', 'Communication Master', 'Achieve excellent communication scores on 20 scenarios', '💬', 'skill', 350, '#607D8B')
ON CONFLICT (code) DO NOTHING;

INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
('early_bird', 'Early Bird', 'Complete a scenario before 8 AM', '🐦', 'special', 100, '#00BCD4')
ON CONFLICT (code) DO NOTHING;

-- Create XP awarding function
CREATE OR REPLACE FUNCTION award_xp(
    p_user_id UUID,
    p_xp_amount INTEGER,
    p_transaction_type VARCHAR(50),
    p_source_id UUID DEFAULT NULL,
    p_source_type VARCHAR(50) DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    current_xp INTEGER;
    current_level INTEGER;
    xp_needed INTEGER;
    new_level INTEGER;
    xp_remaining INTEGER;
BEGIN
    -- Insert XP transaction
    INSERT INTO xp_transactions (
        user_id, xp_amount, transaction_type, source_id, source_type, description
    ) VALUES (
        p_user_id, p_xp_amount, p_transaction_type, p_source_id, p_source_type, p_description
    );

    -- Get or create user level record
    INSERT INTO user_levels (user_id, current_level, total_xp, level_progress)
    VALUES (p_user_id, 1, p_xp_amount, 0)
    ON CONFLICT (user_id) DO UPDATE SET
        total_xp = user_levels.total_xp + p_xp_amount,
        updated_at = NOW();

    -- Get current level data
    SELECT total_xp, current_level INTO current_xp, current_level
    FROM user_levels WHERE user_id = p_user_id;

    -- Calculate new level
    new_level := current_level;
    xp_remaining := current_xp;
    
    WHILE xp_remaining >= (new_level * 100) LOOP
        xp_remaining := xp_remaining - (new_level * 100);
        new_level := new_level + 1;
    END LOOP;

    -- Update level if changed
    IF new_level > current_level THEN
        UPDATE user_levels SET
            current_level = new_level,
            level_progress = (xp_remaining::DECIMAL / (new_level * 100)) * 100,
            title = CASE 
                WHEN new_level >= 20 THEN 'Medical Professor'
                WHEN new_level >= 15 THEN 'Senior Consultant'
                WHEN new_level >= 10 THEN 'Consultant'
                WHEN new_level >= 5 THEN 'Registrar'
                WHEN new_level >= 3 THEN 'Junior Doctor'
                ELSE 'Medical Student'
            END,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        -- Update progress for current level
        UPDATE user_levels SET
            level_progress = (xp_remaining::DECIMAL / (new_level * 100)) * 100,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create achievement checking function
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID) RETURNS VOID AS $$
BEGIN
    -- This function can be expanded to check for various achievements
    -- For now, it's a placeholder that doesn't cause errors
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Gamification schema created successfully!';
END $$;
