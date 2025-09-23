-- Check and fix Supabase setup for attempts table
-- Run this in your Supabase SQL editor

-- 1. Check if attempts table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'attempts' 
ORDER BY ordinal_position;

-- 2. If attempts table doesn't exist, create it
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

-- 3. Check if attempt_events table exists
CREATE TABLE IF NOT EXISTS attempt_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- e.g., "session_start", "session_end", "message", "score_generated"
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  meta JSONB, -- additional metadata for the event
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Check RLS policies on attempts table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'attempts';

-- 5. If no RLS policies exist, create them (allow authenticated users to manage their own attempts)
DO $$
BEGIN
    -- Enable RLS on attempts table
    ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for users to manage their own attempts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attempts' AND policyname = 'Users can manage their own attempts'
    ) THEN
        CREATE POLICY "Users can manage their own attempts" ON attempts
        FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
    
    -- Create policy for service role to manage all attempts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attempts' AND policyname = 'Service role can manage all attempts'
    ) THEN
        CREATE POLICY "Service role can manage all attempts" ON attempts
        FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- 6. Enable RLS on attempt_events table
ALTER TABLE attempt_events ENABLE ROW LEVEL SECURITY;

-- Create policy for attempt_events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attempt_events' AND policyname = 'Users can manage their own attempt events'
    ) THEN
        CREATE POLICY "Users can manage their own attempt events" ON attempt_events
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM attempts 
                WHERE attempts.id = attempt_events.attempt_id 
                AND auth.uid()::text = attempts.user_id::text
            )
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attempt_events' AND policyname = 'Service role can manage all attempt events'
    ) THEN
        CREATE POLICY "Service role can manage all attempt events" ON attempt_events
        FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- 7. Check if stations table exists and has data
SELECT COUNT(*) as station_count FROM stations;

-- 8. Insert default stations if they don't exist
INSERT INTO stations (slug, title) VALUES 
('chest-pain', 'Chest Pain Assessment'),
('shortness-of-breath', 'Shortness of Breath Assessment'),
('falls', 'Falls Assessment')
ON CONFLICT (slug) DO NOTHING;

-- 9. Check if users table exists
SELECT COUNT(*) as user_count FROM users;
