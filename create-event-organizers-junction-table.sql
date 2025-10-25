-- Create the missing event_organizers junction table
-- This table handles the many-to-many relationship between events and organizers

-- Create the event_organizers junction table
CREATE TABLE IF NOT EXISTS event_organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combinations
    UNIQUE(event_id, organizer_id)
);

-- Enable RLS
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all for now)
CREATE POLICY "Allow all operations on event_organizers" ON event_organizers FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_organizers_event_id ON event_organizers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_organizer_id ON event_organizers(organizer_id);

-- Check if the table was created successfully
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_organizers' 
ORDER BY ordinal_position;


