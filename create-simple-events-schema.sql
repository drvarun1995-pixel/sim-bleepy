-- Simple Event Management Schema for Supabase
-- This script creates a basic events table with the required fields

-- ========================================
-- 1. CREATE EVENTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  format VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'rescheduled', 'postponed', 'cancelled', 'moved-online')),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_format ON events(format);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- ========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. CREATE RLS POLICIES
-- ========================================

-- Public can read active events
CREATE POLICY "Public can read active events" ON events
  FOR SELECT USING (status IN ('scheduled', 'rescheduled', 'moved-online'));

-- Authenticated users can insert events
CREATE POLICY "Authenticated users can insert events" ON events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own events
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own events
CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = created_by);

-- ========================================
-- 5. CREATE TRIGGER FUNCTION FOR UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- 6. CREATE TRIGGER FOR AUTOMATIC UPDATED_AT
-- ========================================

CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. GRANT PERMISSIONS
-- ========================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;

-- Grant permissions to anon users for reading
GRANT SELECT ON events TO anon;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Simple Event Management Schema Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- events table with title, content, category, format';
  RAISE NOTICE '- All necessary indexes for performance';
  RAISE NOTICE '- RLS policies for security';
  RAISE NOTICE '- Helper functions and triggers';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Ready to use with your Next.js application!';
  RAISE NOTICE '========================================';
END $$;

