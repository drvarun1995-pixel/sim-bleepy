-- Gamification Database Schema
-- This script creates all tables needed for gamification features

-- 1. User levels and progression
CREATE TABLE IF NOT EXISTS user_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL DEFAULT 1,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Percentage to next level
    title VARCHAR(50) DEFAULT 'Medical Student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'first_scenario', 'perfect_score'
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '🏆', -- Emoji or icon name
    category VARCHAR(50) NOT NULL, -- 'completion', 'skill', 'social', 'special'
    xp_reward INTEGER DEFAULT 100,
    badge_color VARCHAR(20) DEFAULT '#FFD700', -- Gold default
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User achievements (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0, -- For progressive achievements
    is_completed BOOLEAN DEFAULT false,
    UNIQUE(user_id, achievement_id)
);

-- 4. Skill tracking
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(50) NOT NULL, -- 'communication', 'diagnosis', 'management'
    skill_level INTEGER NOT NULL DEFAULT 1,
    skill_xp INTEGER NOT NULL DEFAULT 0,
    level_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- 5. Daily streaks and habits
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL, -- 'daily_practice', 'perfect_week', 'monthly'
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    streak_start_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

-- 6. Leaderboards (cached for performance)
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leaderboard_type VARCHAR(50) NOT NULL, -- 'weekly_xp', 'monthly_xp', 'total_xp', 'streak'
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, leaderboard_type, period_start)
);

-- 7. Challenges and events
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    challenge_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'special'
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    xp_reward INTEGER DEFAULT 500,
    badge_reward VARCHAR(50), -- Achievement code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. User challenge participation
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 9. XP transactions (audit trail)
CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'scenario_complete', 'achievement_earned', 'streak_bonus'
    source_id UUID, -- ID of the source (scenario, achievement, etc.)
    source_type VARCHAR(50), -- 'scenario', 'achievement', 'challenge'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_name ON user_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_type_period ON leaderboards(leaderboard_type, period_start);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_id ON leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at);

-- Insert default achievements
INSERT INTO achievements (code, name, description, icon, category, xp_reward, badge_color) VALUES
-- Completion achievements
('first_scenario', 'First Steps', 'Complete your first scenario', '👶', 'completion', 100, '#FFD700'),
('scenario_master', 'Scenario Master', 'Complete 50 scenarios', '🎯', 'completion', 500, '#C0C0C0'),
('perfect_score', 'Perfect Score', 'Get 100% on any scenario', '💯', 'completion', 200, '#FF6B6B'),
('daily_practice', 'Daily Practitioner', 'Practice for 7 consecutive days', '📅', 'completion', 300, '#4ECDC4'),

-- Skill achievements
('communication_expert', 'Communication Expert', 'Average 90%+ on communication skills', '💬', 'skill', 400, '#45B7D1'),
('diagnosis_detective', 'Diagnosis Detective', 'Correctly diagnose 20 cases', '🔍', 'skill', 400, '#96CEB4'),
('empathy_champion', 'Empathy Champion', 'High empathy scores in 10 scenarios', '❤️', 'skill', 350, '#FFEAA7'),

-- Social achievements
('team_player', 'Team Player', 'Help 5 classmates', '🤝', 'social', 300, '#A8E6CF'),
('mentor', 'Mentor', 'Guide a junior student', '👨‍🏫', 'social', 500, '#FFB6C1'),

-- Special achievements
('night_owl', 'Night Owl', 'Complete scenarios after 10 PM', '🦉', 'special', 150, '#6C5CE7'),
('early_bird', 'Early Bird', 'Complete scenarios before 7 AM', '🐦', 'special', 150, '#FDCB6E'),
('speed_demon', 'Speed Demon', 'Complete a scenario in under 5 minutes', '⚡', 'special', 200, '#E17055'),
('perfectionist', 'Perfectionist', 'Get perfect scores on 10 scenarios', '✨', 'special', 600, '#FD79A8');

-- Insert default challenges
INSERT INTO challenges (name, description, challenge_type, start_date, end_date, xp_reward, badge_reward) VALUES
('Daily Practice Challenge', 'Complete at least 2 scenarios today', 'daily', NOW(), NOW() + INTERVAL '1 day', 150, NULL),
('Weekly Excellence', 'Complete 10 scenarios this week with 80%+ average', 'weekly', NOW(), NOW() + INTERVAL '7 days', 500, 'scenario_master'),
('Monthly Mastery', 'Complete 50 scenarios this month', 'monthly', NOW(), NOW() + INTERVAL '30 days', 1000, NULL);

-- Enable Row Level Security
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own gamification data" ON user_levels
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own skills" ON user_skills
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own streaks" ON user_streaks
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own leaderboard data" ON leaderboards
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own challenge participation" ON user_challenges
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own XP transactions" ON xp_transactions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Public read access for achievements and challenges
CREATE POLICY "Anyone can view achievements" ON achievements
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view challenges" ON challenges
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view leaderboards" ON leaderboards
    FOR SELECT USING (true);

-- Functions for gamification logic
CREATE OR REPLACE FUNCTION calculate_level_from_xp(total_xp INTEGER)
RETURNS TABLE(level INTEGER, xp_for_next INTEGER, progress DECIMAL) AS $$
BEGIN
    -- Simple level calculation: 1000 XP per level
    RETURN QUERY SELECT 
        (total_xp / 1000) + 1 as level,
        1000 - (total_xp % 1000) as xp_for_next,
        ((total_xp % 1000)::DECIMAL / 1000) * 100 as progress;
END;
$$ LANGUAGE plpgsql;

-- Function to award XP and update levels
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

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    achievement_record RECORD;
BEGIN
    -- Check completion achievements
    FOR achievement_record IN 
        SELECT a.* FROM achievements a 
        WHERE a.category = 'completion' 
        AND a.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
        )
    LOOP
        CASE achievement_record.code
            WHEN 'first_scenario' THEN
                IF EXISTS (SELECT 1 FROM attempts WHERE user_id = p_user_id LIMIT 1) THEN
                    INSERT INTO user_achievements (user_id, achievement_id, is_completed)
                    VALUES (p_user_id, achievement_record.id, true);
                    PERFORM award_xp(p_user_id, achievement_record.xp_reward, 'achievement_earned', achievement_record.id, 'achievement', achievement_record.name);
                END IF;
            WHEN 'scenario_master' THEN
                IF (SELECT COUNT(*) FROM attempts WHERE user_id = p_user_id) >= 50 THEN
                    INSERT INTO user_achievements (user_id, achievement_id, is_completed)
                    VALUES (p_user_id, achievement_record.id, true);
                    PERFORM award_xp(p_user_id, achievement_record.xp_reward, 'achievement_earned', achievement_record.id, 'achievement', achievement_record.name);
                END IF;
            -- Add more achievement checks here
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_levels IS 'Tracks user progression levels and XP';
COMMENT ON TABLE achievements IS 'Defines available achievements and badges';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements users have earned';
COMMENT ON TABLE user_skills IS 'Tracks individual skill progression';
COMMENT ON TABLE user_streaks IS 'Tracks daily/weekly/monthly streaks';
COMMENT ON TABLE leaderboards IS 'Cached leaderboard data for performance';
COMMENT ON TABLE challenges IS 'Defines special challenges and events';
COMMENT ON TABLE user_challenges IS 'Tracks user participation in challenges';
COMMENT ON TABLE xp_transactions IS 'Audit trail of all XP transactions';
