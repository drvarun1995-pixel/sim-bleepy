-- Sim-Bleepy Analytics Dashboard Schema
-- Create all required tables with RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'educator', 'admin');
CREATE TYPE station_status AS ENUM ('active', 'draft', 'archived', 'maintenance');
CREATE TYPE billing_status AS ENUM ('active', 'cancelled', 'past_due', 'incomplete');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  org TEXT,
  year TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  status station_status DEFAULT 'active',
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  version INTEGER DEFAULT 1,
  owner_id UUID REFERENCES profiles(id),
  description TEXT,
  estimated_duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_s INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  device TEXT,
  browser TEXT,
  org TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  overall_pct INTEGER CHECK (overall_pct >= 0 AND overall_pct <= 100),
  data_gathering_pct INTEGER CHECK (data_gathering_pct >= 0 AND data_gathering_pct <= 100),
  clinical_mgmt_pct INTEGER CHECK (clinical_mgmt_pct >= 0 AND clinical_mgmt_pct <= 100),
  communication_pct INTEGER CHECK (communication_pct >= 0 AND communication_pct <= 100),
  red_flags_missed JSONB DEFAULT '[]',
  feedback_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  turns JSONB DEFAULT '[]',
  token_counts JSONB DEFAULT '{}',
  kept_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 years'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tech metrics table
CREATE TABLE IF NOT EXISTS tech_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
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

-- Cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  org TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort members table
CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cohort_id, user_id)
);

-- A/B Tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  station_id UUID NOT NULL REFERENCES stations(id),
  variants JSONB NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  winner_variant TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B Test assignments table
CREATE TABLE IF NOT EXISTS ab_assignments (
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (test_id, user_id)
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  stripe_customer_id TEXT,
  price_gbp DECIMAL(10,2),
  status billing_status DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort assignments table
CREATE TABLE IF NOT EXISTS cohort_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  station_ids UUID[] NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  open_at TIMESTAMPTZ NOT NULL,
  close_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_station_id ON sessions(station_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_scores_session_id ON scores(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_tech_metrics_session_id ON tech_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort_id ON cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user_id ON cohort_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_test_id ON ab_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user_id ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(org);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON cohorts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

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

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Stations policies
CREATE POLICY "Everyone can view active stations" ON stations
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage all stations" ON stations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Station owners can manage their stations" ON stations
  FOR ALL USING (owner_id = auth.uid());

-- Sessions policies
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Educators can view cohort sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohort_members cm
      JOIN cohorts c ON cm.cohort_id = c.id
      WHERE cm.user_id = sessions.user_id 
      AND c.owner_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'educator'
      )
    )
  );

CREATE POLICY "Admins can view all sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Scores policies
CREATE POLICY "Users can view their own scores" ON scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE id = scores.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Educators can view cohort scores" ON scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN cohort_members cm ON cm.user_id = s.user_id
      JOIN cohorts c ON cm.cohort_id = c.id
      WHERE s.id = scores.session_id 
      AND c.owner_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'educator'
      )
    )
  );

CREATE POLICY "Admins can view all scores" ON scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Transcripts policies (more restrictive)
CREATE POLICY "Users can view their own transcripts" ON transcripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE id = transcripts.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transcripts" ON transcripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tech metrics policies
CREATE POLICY "Admins can view all tech metrics" ON tech_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cohorts policies
CREATE POLICY "Users can view cohorts they belong to" ON cohorts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohort_members 
      WHERE cohort_id = cohorts.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Cohort owners can manage their cohorts" ON cohorts
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all cohorts" ON cohorts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cohort members policies
CREATE POLICY "Cohort owners can manage members" ON cohort_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cohorts 
      WHERE id = cohort_members.cohort_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all cohort members" ON cohort_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- A/B Tests policies
CREATE POLICY "Admins can manage A/B tests" ON ab_tests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- A/B Assignments policies
CREATE POLICY "Users can view their A/B assignments" ON ab_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage A/B assignments" ON ab_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Billing policies
CREATE POLICY "Users can view their own billing" ON billing
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all billing" ON billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cohort assignments policies
CREATE POLICY "Cohort members can view their assignments" ON cohort_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohort_members 
      WHERE cohort_id = cohort_assignments.cohort_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Cohort owners can manage assignments" ON cohort_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cohorts 
      WHERE id = cohort_assignments.cohort_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assignments" ON cohort_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create views for analytics
CREATE VIEW user_stats AS
SELECT 
  p.id,
  p.role,
  p.org,
  COUNT(s.id) as total_sessions,
  COUNT(CASE WHEN s.completed = true THEN 1 END) as completed_sessions,
  AVG(sc.overall_pct) as avg_score,
  MAX(s.started_at) as last_session_at
FROM profiles p
LEFT JOIN sessions s ON p.id = s.user_id
LEFT JOIN scores sc ON s.id = sc.session_id
GROUP BY p.id, p.role, p.org;

CREATE VIEW station_stats AS
SELECT 
  st.id,
  st.title,
  st.specialty,
  st.difficulty,
  COUNT(s.id) as total_attempts,
  COUNT(CASE WHEN s.completed = true THEN 1 END) as completed_attempts,
  AVG(sc.overall_pct) as avg_score,
  AVG(s.duration_s) as avg_duration_seconds
FROM stations st
LEFT JOIN sessions s ON st.id = s.station_id
LEFT JOIN scores sc ON s.id = sc.session_id
GROUP BY st.id, st.title, st.specialty, st.difficulty;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
