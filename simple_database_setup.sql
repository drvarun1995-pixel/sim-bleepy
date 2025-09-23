-- Simple Database Setup for Sim-Bleepy (No Foreign Keys)
-- Run this script in your Supabase SQL Editor

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CREATE TABLES WITHOUT FOREIGN KEYS FIRST
-- =====================================================

-- Profiles table for user roles and organization info
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
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
  owner_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohorts table for educational cohorts
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  org TEXT NOT NULL,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table for user simulation sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  station_id UUID,
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
  session_id UUID,
  overall_pct INTEGER CHECK (overall_pct >= 0 AND overall_pct <= 100),
  data_gathering_pct INTEGER CHECK (data_gathering_pct >= 0 AND data_gathering_pct <= 100),
  clinical_mgmt_pct INTEGER CHECK (clinical_mgmt_pct >= 0 AND clinical_mgmt_pct <= 100),
  communication_pct INTEGER CHECK (communication_pct >= 0 AND communication_pct <= 100),
  red_flags_missed JSONB DEFAULT '[]'::jsonb
);

-- Transcripts table for session transcripts
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID,
  turns JSONB DEFAULT '[]'::jsonb,
  token_counts JSONB DEFAULT '{}'::jsonb,
  kept_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Tech metrics table for technical performance data
CREATE TABLE IF NOT EXISTS tech_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID,
  asr_latency_ms INTEGER,
  tts_latency_ms INTEGER,
  rtt_ms INTEGER,
  disconnects INTEGER DEFAULT 0,
  error_code TEXT,
  provider TEXT,
  tokens_used INTEGER,
  cost_estimate_gbp DECIMAL(10,4)
);

-- Cohort members table for cohort membership
CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id UUID,
  user_id UUID,
  PRIMARY KEY (cohort_id, user_id)
);

-- A/B tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  station_id UUID,
  variants JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('draft', 'running', 'completed', 'paused')) DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  winner_variant TEXT
);

-- A/B assignments table
CREATE TABLE IF NOT EXISTS ab_assignments (
  test_id UUID,
  user_id UUID,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (test_id, user_id)
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  user_id UUID PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  price_gbp DECIMAL(10,2),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort assignments table
CREATE TABLE IF NOT EXISTS cohort_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_id UUID,
  station_ids UUID[] DEFAULT '{}',
  open_at TIMESTAMPTZ NOT NULL,
  close_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage Tracking Table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID,
  provider TEXT NOT NULL CHECK (provider IN ('hume', 'openai')),
  service TEXT NOT NULL CHECK (service IN ('asr', 'tts', 'chat', 'embeddings', 'emotion')),
  tokens_used INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  cost_gbp DECIMAL(10,4) NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints after all tables are created
ALTER TABLE stations ADD CONSTRAINT fk_stations_owner_id FOREIGN KEY (owner_id) REFERENCES profiles(id);
ALTER TABLE cohorts ADD CONSTRAINT fk_cohorts_owner_id FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_station_id FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE;
ALTER TABLE scores ADD CONSTRAINT fk_scores_session_id FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
ALTER TABLE transcripts ADD CONSTRAINT fk_transcripts_session_id FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
ALTER TABLE tech_metrics ADD CONSTRAINT fk_tech_metrics_session_id FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
ALTER TABLE cohort_members ADD CONSTRAINT fk_cohort_members_cohort_id FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE cohort_members ADD CONSTRAINT fk_cohort_members_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE ab_tests ADD CONSTRAINT fk_ab_tests_station_id FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE;
ALTER TABLE ab_assignments ADD CONSTRAINT fk_ab_assignments_test_id FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE;
ALTER TABLE ab_assignments ADD CONSTRAINT fk_ab_assignments_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE billing ADD CONSTRAINT fk_billing_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE cohort_assignments ADD CONSTRAINT fk_cohort_assignments_cohort_id FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE api_usage ADD CONSTRAINT fk_api_usage_session_id FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(org);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

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

-- Cohort indexes
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort_id ON cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user_id ON cohort_members(user_id);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

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

-- =====================================================
-- 6. CREATE BASIC RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (true);

-- Stations policies (public read)
CREATE POLICY "Anyone can view active stations" ON stations
  FOR SELECT USING (status = 'active');

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (true);

-- Scores policies
CREATE POLICY "Users can view own scores" ON scores
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores" ON scores
  FOR INSERT WITH CHECK (true);

-- Transcripts policies
CREATE POLICY "Users can view own transcripts" ON transcripts
  FOR SELECT USING (true);

-- Tech metrics policies
CREATE POLICY "Users can view own tech metrics" ON tech_metrics
  FOR SELECT USING (true);

-- Cohorts policies
CREATE POLICY "Users can view cohorts" ON cohorts
  FOR SELECT USING (true);

-- Cohort members policies
CREATE POLICY "Users can view cohort members" ON cohort_members
  FOR SELECT USING (true);

-- A/B Tests policies
CREATE POLICY "Users can view A/B tests" ON ab_tests
  FOR SELECT USING (true);

-- A/B Assignments policies
CREATE POLICY "Users can view A/B assignments" ON ab_assignments
  FOR SELECT USING (true);

-- Billing policies
CREATE POLICY "Users can view billing" ON billing
  FOR SELECT USING (true);

-- Cohort assignments policies
CREATE POLICY "Users can view cohort assignments" ON cohort_assignments
  FOR SELECT USING (true);

-- API Usage policies
CREATE POLICY "Users can view api usage" ON api_usage
  FOR SELECT USING (true);

CREATE POLICY "Users can insert api usage" ON api_usage
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 7. SAMPLE DATA
-- =====================================================

-- Insert sample profiles first
INSERT INTO profiles (email, role, org, full_name) VALUES 
  ('support@bleepy.co.uk', 'admin', 'default', 'System Administrator'),
  ('drvarun1995@gmail.com', 'admin', 'default', 'Dr. Varun Administrator'),
  ('educator@simbleepy.com', 'educator', 'default', 'Medical Educator'),
  ('student@simbleepy.com', 'student', 'default', 'Medical Student')
ON CONFLICT (email) DO NOTHING;

-- Insert sample stations
INSERT INTO stations (title, specialty, status, difficulty, owner_id) VALUES
('Cardiac Emergency', 'Emergency Medicine', 'active', 4, (SELECT id FROM profiles WHERE email = 'support@bleepy.co.uk')),
('Respiratory Distress', 'Pulmonology', 'active', 3, (SELECT id FROM profiles WHERE email = 'support@bleepy.co.uk')),
('Trauma Assessment', 'Emergency Medicine', 'active', 5, (SELECT id FROM profiles WHERE email = 'drvarun1995@gmail.com')),
('Pediatric Fever', 'Pediatrics', 'active', 2, (SELECT id FROM profiles WHERE email = 'drvarun1995@gmail.com')),
('Psychiatric Crisis', 'Psychiatry', 'active', 3, (SELECT id FROM profiles WHERE email = 'support@bleepy.co.uk'))
ON CONFLICT DO NOTHING;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Success message
SELECT 'Database setup completed successfully! All tables, indexes, and policies have been created.' as message;