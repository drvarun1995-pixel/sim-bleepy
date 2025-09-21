-- Simple Database Setup for Sim-Bleepy Analytics Dashboard
-- Run this script in your Supabase SQL Editor

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CREATE TABLES (simplified version)
-- =====================================================

-- Profiles table for user roles and organization info
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'educator', 'admin')) DEFAULT 'student',
  org TEXT DEFAULT 'default',
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

-- Scores table for session scoring
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  overall_pct INTEGER CHECK (overall_pct >= 0 AND overall_pct <= 100),
  data_gathering_pct INTEGER CHECK (data_gathering_pct >= 0 AND data_gathering_pct <= 100),
  clinical_mgmt_pct INTEGER CHECK (clinical_mgmt_pct >= 0 AND clinical_mgmt_pct <= 100),
  communication_pct INTEGER CHECK (communication_pct >= 0 AND communication_pct <= 100),
  red_flags_missed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts table for session transcripts
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  turns JSONB DEFAULT '[]',
  token_counts JSONB DEFAULT '{}',
  kept_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tech metrics table for performance tracking
CREATE TABLE IF NOT EXISTS tech_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  asr_latency_ms INTEGER DEFAULT 0,
  tts_latency_ms INTEGER DEFAULT 0,
  rtt_ms INTEGER DEFAULT 0,
  disconnects INTEGER DEFAULT 0,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohorts table for grouping students
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  org TEXT DEFAULT 'default',
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort members table
CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (cohort_id, user_id)
);

-- A/B tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
  variants JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B test assignments table
CREATE TABLE IF NOT EXISTS ab_assignments (
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  variant TEXT NOT NULL,
  PRIMARY KEY (test_id, user_id)
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  price_gbp NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort assignments table
CREATE TABLE IF NOT EXISTS cohort_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
  station_ids UUID[] DEFAULT '{}',
  open_at TIMESTAMPTZ DEFAULT NOW(),
  close_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('hume', 'openai')),
  service TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  cost_gbp NUMERIC(10,6) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_station_id ON sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_scores_session_id ON scores(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_tech_metrics_session_id ON tech_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort_id ON cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user_id ON cohort_members(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_session_id ON api_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);

-- =====================================================
-- 4. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample profiles
INSERT INTO profiles (email, role, org, full_name) VALUES 
  ('admin@simbleepy.com', 'admin', 'default', 'System Administrator'),
  ('educator@simbleepy.com', 'educator', 'default', 'Medical Educator'),
  ('student@simbleepy.com', 'student', 'default', 'Medical Student')
ON CONFLICT (email) DO NOTHING;

-- Insert sample stations
INSERT INTO stations (title, specialty, status, difficulty, owner_id) VALUES 
  ('Chest Pain Assessment', 'Cardiology', 'active', 3, (SELECT id FROM profiles WHERE email = 'admin@simbleepy.com')),
  ('Falls Assessment', 'Geriatrics', 'active', 2, (SELECT id FROM profiles WHERE email = 'admin@simbleepy.com')),
  ('Shortness of Breath', 'Pulmonology', 'active', 4, (SELECT id FROM profiles WHERE email = 'admin@simbleepy.com')),
  ('Abdominal Pain', 'Gastroenterology', 'active', 3, (SELECT id FROM profiles WHERE email = 'admin@simbleepy.com')),
  ('Headache Assessment', 'Neurology', 'active', 2, (SELECT id FROM profiles WHERE email = 'admin@simbleepy.com'))
ON CONFLICT DO NOTHING;

-- Insert sample cohort
INSERT INTO cohorts (name, org, owner_id) VALUES 
  ('Medical Students 2024', 'default', (SELECT id FROM profiles WHERE email = 'educator@simbleepy.com'))
ON CONFLICT DO NOTHING;

-- Add student to cohort
INSERT INTO cohort_members (cohort_id, user_id) VALUES 
  ((SELECT id FROM cohorts WHERE name = 'Medical Students 2024'), 
   (SELECT id FROM profiles WHERE email = 'student@simbleepy.com'))
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
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

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id::text);

-- Stations policies (public read, admin write)
CREATE POLICY "Anyone can view active stations" ON stations FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage stations" ON stations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::uuid AND role = 'admin')
);

-- Sessions policies
CREATE POLICY "Users can view their own sessions" ON sessions FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can create their own sessions" ON sessions FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update their own sessions" ON sessions FOR UPDATE USING (user_id = auth.uid()::uuid);

-- Scores policies
CREATE POLICY "Users can view scores for their sessions" ON scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM sessions WHERE sessions.id = scores.session_id AND sessions.user_id = auth.uid()::uuid)
);

-- Transcripts policies (similar to sessions)
CREATE POLICY "Users can view transcripts for their sessions" ON transcripts FOR SELECT USING (
  EXISTS (SELECT 1 FROM sessions WHERE sessions.id = transcripts.session_id AND sessions.user_id = auth.uid()::uuid)
);

-- Tech metrics policies (similar to sessions)
CREATE POLICY "Users can view tech metrics for their sessions" ON tech_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM sessions WHERE sessions.id = tech_metrics.session_id AND sessions.user_id = auth.uid()::uuid)
);

-- Cohorts policies
CREATE POLICY "Educators can view their cohorts" ON cohorts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::uuid AND role IN ('educator', 'admin'))
);

-- Cohort members policies
CREATE POLICY "Educators can view cohort members" ON cohort_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::uuid AND role IN ('educator', 'admin'))
);

-- API usage policies (admin only for now)
CREATE POLICY "Admins can view API usage" ON api_usage FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::uuid AND role = 'admin')
);

-- =====================================================
-- 7. CREATE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
