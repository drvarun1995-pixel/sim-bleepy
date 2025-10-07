-- =====================================================
-- STEP 4: ENABLE RLS ON LOCATIONS, ORGANIZERS, SPEAKERS
-- =====================================================

-- Enable RLS on locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create safe policies for locations
DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_update_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_delete_policy" ON public.locations;

CREATE POLICY "locations_select_policy" ON public.locations 
  FOR SELECT USING (true);

CREATE POLICY "locations_insert_policy" ON public.locations 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "locations_update_policy" ON public.locations 
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "locations_delete_policy" ON public.locations 
  FOR DELETE TO authenticated USING (true);

-- Enable RLS on organizers
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

-- Create safe policies for organizers
DROP POLICY IF EXISTS "organizers_select_policy" ON public.organizers;
DROP POLICY IF EXISTS "organizers_insert_policy" ON public.organizers;
DROP POLICY IF EXISTS "organizers_update_policy" ON public.organizers;
DROP POLICY IF EXISTS "organizers_delete_policy" ON public.organizers;

CREATE POLICY "organizers_select_policy" ON public.organizers 
  FOR SELECT USING (true);

CREATE POLICY "organizers_insert_policy" ON public.organizers 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "organizers_update_policy" ON public.organizers 
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "organizers_delete_policy" ON public.organizers 
  FOR DELETE TO authenticated USING (true);

-- Enable RLS on speakers
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;

-- Create safe policies for speakers
DROP POLICY IF EXISTS "speakers_select_policy" ON public.speakers;
DROP POLICY IF EXISTS "speakers_insert_policy" ON public.speakers;
DROP POLICY IF EXISTS "speakers_update_policy" ON public.speakers;
DROP POLICY IF EXISTS "speakers_delete_policy" ON public.speakers;

CREATE POLICY "speakers_select_policy" ON public.speakers 
  FOR SELECT USING (true);

CREATE POLICY "speakers_insert_policy" ON public.speakers 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "speakers_update_policy" ON public.speakers 
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "speakers_delete_policy" ON public.speakers 
  FOR DELETE TO authenticated USING (true);

-- Verify
SELECT 'Locations, Organizers, Speakers RLS enabled' as status;
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('locations', 'organizers', 'speakers')
ORDER BY tablename;
