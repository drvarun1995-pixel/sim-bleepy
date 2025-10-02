-- CREATE JUNCTION TABLES FOR MULTIPLE LOCATIONS AND ORGANIZERS
-- This enables many-to-many relationships for locations and organizers

-- =====================================================
-- EVENT_LOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, location_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_event_locations_event_id ON public.event_locations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_locations_location_id ON public.event_locations(location_id);

-- Disable RLS for now (same as categories and speakers)
ALTER TABLE public.event_locations DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- EVENT_ORGANIZERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_organizers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, organizer_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_event_organizers_event_id ON public.event_organizers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_organizer_id ON public.event_organizers(organizer_id);

-- Disable RLS for now (same as categories and speakers)
ALTER TABLE public.event_organizers DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Tables Created Successfully!' as status;

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('event_locations', 'event_organizers')
ORDER BY table_name;

