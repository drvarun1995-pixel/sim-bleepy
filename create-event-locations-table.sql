-- =====================================================
-- CREATE EVENT_LOCATIONS JUNCTION TABLE
-- =====================================================
-- This creates the missing event_locations junction table
-- that the API expects to exist for multiple locations
-- =====================================================

BEGIN;

-- Create the event_locations junction table
CREATE TABLE IF NOT EXISTS event_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combinations
  UNIQUE(event_id, location_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_locations_event_id ON event_locations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_locations_location_id ON event_locations(location_id);

-- Enable RLS
ALTER TABLE event_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now, can be restricted later)
CREATE POLICY "Allow all operations on event_locations" ON event_locations
  FOR ALL USING (true) WITH CHECK (true);

COMMIT;
