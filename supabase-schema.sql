-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Stations table
CREATE TABLE IF NOT EXISTS stations (
  slug VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL
);

-- Create Attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_slug VARCHAR(100) NOT NULL REFERENCES stations(slug) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- duration in seconds
  scores JSONB, -- store the scoring data as JSON
  overall_band VARCHAR(50), -- e.g., "Pass", "Fail", "Distinction"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Attempt Events table
CREATE TABLE IF NOT EXISTS attempt_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- e.g., "session_start", "session_end", "message", "score_generated"
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  meta JSONB, -- additional metadata for the event
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default stations
INSERT INTO stations (slug, title) VALUES 
  ('chest-pain', 'Chest Pain'),
  ('shortness-of-breath', 'Shortness of Breath')
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_station_slug ON attempts(station_slug);
CREATE INDEX IF NOT EXISTS idx_attempts_start_time ON attempts(start_time);
CREATE INDEX IF NOT EXISTS idx_attempt_events_attempt_id ON attempt_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_events_timestamp ON attempt_events(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_events ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for stations table (public read access)
CREATE POLICY "Stations are publicly readable" ON stations
  FOR SELECT USING (true);

-- Create policies for attempts table
CREATE POLICY "Users can view their own attempts" ON attempts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own attempts" ON attempts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own attempts" ON attempts
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create policies for attempt_events table
CREATE POLICY "Users can view events for their attempts" ON attempt_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attempts 
      WHERE attempts.id = attempt_events.attempt_id 
      AND attempts.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert events for their attempts" ON attempt_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attempts 
      WHERE attempts.id = attempt_events.attempt_id 
      AND attempts.user_id::text = auth.uid()::text
    )
  );
