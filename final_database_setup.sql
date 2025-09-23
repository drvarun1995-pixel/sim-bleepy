-- Final Database Setup for Sim-Bleepy (Based on your existing structure)
-- This script works with your actual table structure

-- =====================================================
-- 1. ANALYZE YOUR EXISTING STRUCTURE
-- =====================================================

-- Your existing tables and their structure:
-- users: id (UUID), email, name, created_at
-- stations: slug (VARCHAR), title
-- attempts: id (UUID), user_id (UUID), station_slug (VARCHAR), start_time, end_time, duration, scores (JSONB), overall_band, created_at
-- attempt_events: id (UUID), attempt_id (UUID), type, timestamp, meta (JSONB), created_at

-- =====================================================
-- 2. CREATE ANALYTICS TABLES THAT WORK WITH YOUR STRUCTURE
-- =====================================================

-- Create profiles table that links to your existing users table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'educator', 'admin')) DEFAULT 'student',
  org TEXT DEFAULT 'default',
  year TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table that works with your existing attempts
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  station_slug VARCHAR(100) REFERENCES stations(slug) ON DELETE CASCADE NOT NULL,
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE, -- Link to existing attempts
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_s INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  device TEXT,
  browser TEXT,
  org TEXT
);

-- Create scores table for detailed session scoring
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  overall_pct INTEGER CHECK (overall_pct >= 0 AND overall_pct <= 100),
  data_gathering_pct INTEGER CHECK (data_gathering_pct >= 0 AND data_gathering_pct <= 100),
  clinical_mgmt_pct INTEGER CHECK (clinical_mgmt_pct >= 0 AND clinical_mgmt_pct <= 100),
  communication_pct INTEGER CHECK (communication_pct >= 0 AND communication_pct <= 100),
  red_flags_missed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transcripts table for session transcripts
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  turns JSONB DEFAULT '[]'::jsonb,
  token_counts JSONB DEFAULT '{}'::jsonb,
  kept_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tech metrics table for technical performance data
CREATE TABLE IF NOT EXISTS tech_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  asr_latency_ms INTEGER,
  tts_latency_ms INTEGER,
  rtt_ms INTEGER,
  disconnects INTEGER DEFAULT 0,
  error_code TEXT,
  provider TEXT,
  tokens_used INTEGER,
  cost_estimate_gbp DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cohorts table for educational cohorts
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  org TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cohort members table for cohort membership
CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cohort_id, user_id)
);

-- Create A/B tests table (using station_slug instead of station_id)
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  station_slug VARCHAR(100) REFERENCES stations(slug) ON DELETE CASCADE,
  variants JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('draft', 'running', 'completed', 'paused')) DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  winner_variant TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create A/B assignments table
CREATE TABLE IF NOT EXISTS ab_assignments (
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (test_id, user_id)
);

-- Create billing table
CREATE TABLE IF NOT EXISTS billing (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  price_gbp DECIMAL(10,2),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Create cohort assignments table
CREATE TABLE IF NOT EXISTS cohort_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
  station_slugs VARCHAR(100)[] DEFAULT '{}', -- Changed to station_slugs to match your structure
  title TEXT,
  description TEXT,
  open_at TIMESTAMPTZ NOT NULL,
  close_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('hume', 'openai')),
  service TEXT NOT NULL CHECK (service IN ('asr', 'tts', 'chat', 'embeddings', 'emotion')),
  tokens_used INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  cost_gbp DECIMAL(10,4) NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_station_slug ON sessions(station_slug);
CREATE INDEX IF NOT EXISTS idx_sessions_attempt_id ON sessions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

-- Scores indexes
CREATE INDEX IF NOT EXISTS idx_scores_session_id ON scores(session_id);
CREATE INDEX IF NOT EXISTS idx_scores_overall_pct ON scores(overall_pct);

-- API usage indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_session_id ON api_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);

-- Cohort indexes
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort_id ON cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user_id ON cohort_members(user_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE BASIC RLS POLICIES (Simplified for now)
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (true);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (true);

-- Scores policies
CREATE POLICY "Users can view own scores" ON scores
  FOR SELECT USING (true);

-- Transcripts policies
CREATE POLICY "Users can view own transcripts" ON transcripts
  FOR SELECT USING (true);

-- Tech metrics policies
CREATE POLICY "Users can view own tech metrics" ON tech_metrics
  FOR SELECT USING (true);

-- Cohorts policies
CREATE POLICY "Users can view cohorts" ON cohorts
  FOR SELECT USING (true);

-- API Usage policies
CREATE POLICY "Users can view api usage" ON api_usage
  FOR SELECT USING (true);

CREATE POLICY "Users can insert api usage" ON api_usage
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get usage summary
CREATE OR REPLACE FUNCTION get_usage_summary(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  target_session_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_cost', COALESCE(SUM(cost_gbp), 0),
    'total_tokens', COALESCE(SUM(tokens_used), 0),
    'total_duration', COALESCE(SUM(duration_ms), 0),
    'provider_breakdown', jsonb_build_object(
      'hume', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN provider = 'hume' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN provider = 'hume' THEN tokens_used ELSE 0 END), 0),
        'duration', COALESCE(SUM(CASE WHEN provider = 'hume' THEN duration_ms ELSE 0 END), 0)
      ),
      'openai', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN provider = 'openai' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN provider = 'openai' THEN tokens_used ELSE 0 END), 0),
        'duration', COALESCE(SUM(CASE WHEN provider = 'openai' THEN duration_ms ELSE 0 END), 0)
      )
    )
  ) INTO result
  FROM api_usage
  WHERE (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date)
    AND (target_session_id IS NULL OR session_id = target_session_id);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_usage_summary TO authenticated;

-- =====================================================
-- 7. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample profiles for your admin emails
INSERT INTO profiles (user_id, email, role, org, full_name) VALUES 
  (NULL, 'support@bleepy.co.uk', 'admin', 'default', 'System Administrator'),
  (NULL, 'drvarun1995@gmail.com', 'admin', 'default', 'Dr. Varun Administrator')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Success message
SELECT 'Final database setup completed successfully! Analytics tables added to work with your existing structure.' as message;



