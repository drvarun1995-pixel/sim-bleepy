-- Medical Quiz Game Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_text TEXT NOT NULL,
  scenario_image_url TEXT,
  scenario_table_data JSONB, -- TipTap table data
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E')),
  explanation_text TEXT NOT NULL,
  explanation_image_url TEXT,
  explanation_table_data JSONB,
  category TEXT NOT NULL, -- e.g., 'Cardiology', 'Anatomy'
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Quiz Challenges Table
CREATE TABLE IF NOT EXISTS quiz_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL, -- 6-digit code
  host_id UUID REFERENCES users(id) NOT NULL,
  question_set_id UUID, -- Optional: predefined set
  selected_categories TEXT[],
  selected_difficulties TEXT[],
  question_count INTEGER DEFAULT 10,
  status TEXT DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'completed', 'cancelled')),
  qr_code_url TEXT, -- Path to QR code in challenge-qr-codes bucket
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quiz Challenge Participants Table
CREATE TABLE IF NOT EXISTS quiz_challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES quiz_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'ready', 'playing', 'disconnected', 'completed')),
  final_score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  average_time_seconds DECIMAL(10,2),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(challenge_id, user_id)
);

-- 4. Quiz Challenge Answers Table
CREATE TABLE IF NOT EXISTS quiz_challenge_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES quiz_challenges(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES quiz_challenge_participants(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id),
  question_order INTEGER, -- Order of question in challenge (1, 2, 3, ...)
  selected_answer CHAR(1),
  is_correct BOOLEAN,
  time_taken_seconds INTEGER,
  points_earned INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Quiz Practice Sessions Table
CREATE TABLE IF NOT EXISTS quiz_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  category TEXT,
  difficulty TEXT,
  question_count INTEGER,
  score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 6. Quiz Practice Answers Table
CREATE TABLE IF NOT EXISTS quiz_practice_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES quiz_practice_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id),
  question_order INTEGER, -- Order of question in practice session (1, 2, 3, ...)
  selected_answer CHAR(1),
  is_correct BOOLEAN,
  time_taken_seconds INTEGER,
  points_earned INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Quiz Campaigns Table
CREATE TABLE IF NOT EXISTS quiz_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Quiz Campaign Sections Table
CREATE TABLE IF NOT EXISTS quiz_campaign_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES quiz_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  unlock_requirement TEXT, -- e.g., 'complete_section_1'
  question_ids UUID[] NOT NULL, -- Array of question IDs
  order_index INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

-- 9. Quiz User Progress Table
CREATE TABLE IF NOT EXISTS quiz_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  section_id UUID REFERENCES quiz_campaign_sections(id),
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed', 'mastered')),
  score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  total_questions INTEGER,
  completed_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ, -- 80%+ correct
  UNIQUE(user_id, section_id)
);

-- 10. Quiz Leaderboards Table
CREATE TABLE IF NOT EXISTS quiz_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  category TEXT, -- NULL for global
  difficulty TEXT, -- NULL for all difficulties
  period TEXT NOT NULL CHECK (period IN ('all_time', 'weekly', 'monthly')),
  total_points INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  average_time_seconds DECIMAL(10,2),
  streak_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, difficulty, period)
);

-- 11. Quiz Categories Table
CREATE TABLE IF NOT EXISTS quiz_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_status ON quiz_questions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_created_by ON quiz_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_quiz_challenges_code ON quiz_challenges(code);
CREATE INDEX IF NOT EXISTS idx_quiz_challenges_status ON quiz_challenges(status);
CREATE INDEX IF NOT EXISTS idx_quiz_challenges_host ON quiz_challenges(host_id);
CREATE INDEX IF NOT EXISTS idx_quiz_challenge_participants_challenge ON quiz_challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_quiz_challenge_participants_user ON quiz_challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_challenge_answers_challenge ON quiz_challenge_answers(challenge_id);
CREATE INDEX IF NOT EXISTS idx_quiz_challenge_answers_participant ON quiz_challenge_answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_quiz_practice_sessions_user ON quiz_practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_practice_answers_session ON quiz_practice_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_user_progress_user ON quiz_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_user_progress_section ON quiz_user_progress(section_id);
CREATE INDEX IF NOT EXISTS idx_quiz_leaderboards_period ON quiz_leaderboards(period, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leaderboards_user ON quiz_leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_leaderboards_category ON quiz_leaderboards(category);
CREATE INDEX IF NOT EXISTS idx_quiz_categories_name ON quiz_categories(name);
CREATE INDEX IF NOT EXISTS idx_quiz_categories_active ON quiz_categories(is_active);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Quiz Questions: Admin-only write, all authenticated read published
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to questions"
ON quiz_questions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can read published questions"
ON quiz_questions FOR SELECT
TO authenticated
USING (status = 'published');

-- Quiz Challenges: Users can read their own or active challenges they joined
ALTER TABLE quiz_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to challenges"
ON quiz_challenges FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: Challenge read access handled via API with user_id filtering

-- Quiz Challenge Participants: Users can read their own participation
ALTER TABLE quiz_challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to participants"
ON quiz_challenge_participants FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: Participant access handled via API with user_id filtering

-- Quiz Challenge Answers: Service role only (handled via API)
ALTER TABLE quiz_challenge_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to challenge answers"
ON quiz_challenge_answers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Quiz Practice Sessions: Users can only access their own
ALTER TABLE quiz_practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to practice sessions"
ON quiz_practice_sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: Practice session access handled via API with user_id filtering

-- Quiz Practice Answers: Service role only (handled via API)
ALTER TABLE quiz_practice_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to practice answers"
ON quiz_practice_answers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Quiz Campaigns: Public read
ALTER TABLE quiz_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to campaigns"
ON quiz_campaigns FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can read active campaigns"
ON quiz_campaigns FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Quiz Campaign Sections: Public read
ALTER TABLE quiz_campaign_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to campaign sections"
ON quiz_campaign_sections FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can read active campaign sections"
ON quiz_campaign_sections FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Quiz User Progress: Users can only access their own
ALTER TABLE quiz_user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to user progress"
ON quiz_user_progress FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: User progress access handled via API with user_id filtering

-- Quiz Leaderboards: Public read
ALTER TABLE quiz_leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to leaderboards"
ON quiz_leaderboards FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can read leaderboards"
ON quiz_leaderboards FOR SELECT
TO authenticated
USING (true);

-- Quiz Categories: Admin-only write, all authenticated read
ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to categories"
ON quiz_categories FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can read active categories"
ON quiz_categories FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_categories_updated_at BEFORE UPDATE ON quiz_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE REALTIME (Run separately in Supabase Dashboard)
-- ============================================================================

-- Enable realtime for challenge tables
-- ALTER PUBLICATION supabase_realtime ADD TABLE quiz_challenges;
-- ALTER PUBLICATION supabase_realtime ADD TABLE quiz_challenge_participants;


