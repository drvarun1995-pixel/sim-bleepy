-- Complete Database Setup for Sim-Bleepy Analytics Dashboard
-- Copy and paste this entire script into your Supabase SQL Editor

-- =====================================================
-- 1. ANALYTICS SCHEMA (from 001_analytics_schema.sql)
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for user roles and organization info
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student', 'educator', 'admin')) DEFAULT 'student',
  org TEXT,
  year TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stations table for medical simulation stations
CREATE TABLE IF NOT EXISTS stations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'draft', 'archived', 'maintenance')) DEFAULT 'active',
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5) DEFAULT 3,
  version INTEGER DEFAULT 1,
  owner_id UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table for user simulation sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_s INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  device TEXT,
  browser TEXT,
  org TEXT
);

-- Scores table for session performance scores
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  overall_pct INTEGER CHECK (overall_pct >= 0 AND overall_pct <= 100),
  data_gathering_pct INTEGER CHECK (data_gathering_pct >= 0 AND data_gathering_pct <= 100),
  clinical_mgmt_pct INTEGER CHECK (clinical_mgmt_pct >= 0 AND clinical_mgmt_pct <= 100),
  communication_pct INTEGER CHECK (communication_pct >= 0 AND communication_pct <= 100),
  red_flags_missed JSONB DEFAULT '[]'::jsonb
);

-- Transcripts table for session transcripts
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  turns JSONB DEFAULT '[]'::jsonb,
  token_counts JSONB DEFAULT '{}'::jsonb,
  kept_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Tech metrics table for technical performance data
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
  cost_estimate_gbp DECIMAL(10,4)
);

-- Cohorts table for educational cohorts
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  org TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort members table for cohort membership
CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (cohort_id, user_id)
);

-- A/B tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
  variants JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('draft', 'running', 'completed', 'paused')) DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  winner_variant TEXT
);

-- A/B assignments table
CREATE TABLE IF NOT EXISTS ab_assignments (
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (test_id, user_id)
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  price_gbp DECIMAL(10,2),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort assignments table
CREATE TABLE IF NOT EXISTS cohort_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
  station_ids UUID[] DEFAULT '{}',
  open_at TIMESTAMPTZ NOT NULL,
  close_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. API USAGE TRACKING (from 002_api_usage_tracking.sql)
-- =====================================================

-- API Usage Tracking Table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('hume', 'openai')),
  service TEXT NOT NULL CHECK (service IN ('asr', 'tts', 'chat', 'embeddings', 'emotion')),
  tokens_used INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  cost_gbp DECIMAL(10,4) NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(org);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_station_id ON sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(completed);

-- Scores indexes
CREATE INDEX IF NOT EXISTS idx_scores_session_id ON scores(session_id);
CREATE INDEX IF NOT EXISTS idx_scores_overall_pct ON scores(overall_pct);

-- API usage indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_session_id ON api_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
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

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Scores policies
CREATE POLICY "Users can view own scores" ON scores
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own scores" ON scores
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- Transcripts policies
CREATE POLICY "Users can view own transcripts" ON transcripts
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- Stations policies (public read)
CREATE POLICY "Anyone can view active stations" ON stations
  FOR SELECT USING (status = 'active');

-- API Usage policies
CREATE POLICY "Users can view own api usage" ON api_usage
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own api usage" ON api_usage
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- =====================================================
-- 5. HELPER FUNCTIONS
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
    ),
    'service_breakdown', jsonb_build_object(
      'asr', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'asr' THEN cost_gbp ELSE 0 END), 0),
        'duration', COALESCE(SUM(CASE WHEN service = 'asr' THEN duration_ms ELSE 0 END), 0)
      ),
      'tts', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'tts' THEN cost_gbp ELSE 0 END), 0),
        'duration', COALESCE(SUM(CASE WHEN service = 'tts' THEN duration_ms ELSE 0 END), 0)
      ),
      'chat', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'chat' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN service = 'chat' THEN tokens_used ELSE 0 END), 0)
      ),
      'embeddings', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'embeddings' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN service = 'embeddings' THEN tokens_used ELSE 0 END), 0)
      ),
      'emotion', jsonb_build_object(
        'cost', COALESCE(SUM(CASE WHEN service = 'emotion' THEN cost_gbp ELSE 0 END), 0),
        'tokens', COALESCE(SUM(CASE WHEN service = 'emotion' THEN tokens_used ELSE 0 END), 0)
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

-- Function to get real-time metrics
CREATE OR REPLACE FUNCTION get_realtime_metrics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH recent_usage AS (
    SELECT COUNT(*) as active_sessions, SUM(cost_gbp) as current_cost
    FROM api_usage
    WHERE created_at >= NOW() - INTERVAL '1 minute'
  ),
  daily_usage AS (
    SELECT SUM(cost_gbp) as daily_cost
    FROM api_usage
    WHERE created_at >= NOW() - INTERVAL '1 day'
  )
  SELECT jsonb_build_object(
    'active_sessions', COALESCE(recent_usage.active_sessions, 0),
    'current_cost_per_minute', COALESCE(recent_usage.current_cost, 0),
    'estimated_daily_cost', COALESCE(daily_usage.daily_cost, 0)
  ) INTO result
  FROM recent_usage, daily_usage;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_usage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_metrics TO authenticated;

-- =====================================================
-- 6. SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample stations
INSERT INTO stations (title, specialty, status, difficulty) VALUES
('Cardiac Emergency', 'Emergency Medicine', 'active', 4),
('Respiratory Distress', 'Pulmonology', 'active', 3),
('Trauma Assessment', 'Emergency Medicine', 'active', 5),
('Pediatric Fever', 'Pediatrics', 'active', 2),
('Psychiatric Crisis', 'Psychiatry', 'active', 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Success message
SELECT 'Database setup completed successfully! All tables, indexes, and policies have been created.' as message;
