-- =====================================================
-- STEP 5: ENABLE RLS ON JUNCTION TABLES
-- =====================================================

-- Enable RLS on event_categories junction table
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- Create safe policies for event_categories
DROP POLICY IF EXISTS "event_categories_select_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_insert_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_update_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_delete_policy" ON public.event_categories;

CREATE POLICY "event_categories_select_policy" ON public.event_categories 
  FOR SELECT USING (true);

CREATE POLICY "event_categories_insert_policy" ON public.event_categories 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "event_categories_update_policy" ON public.event_categories 
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "event_categories_delete_policy" ON public.event_categories 
  FOR DELETE TO authenticated USING (true);

-- Enable RLS on event_speakers junction table
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

-- Create safe policies for event_speakers
DROP POLICY IF EXISTS "event_speakers_select_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_insert_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_update_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_delete_policy" ON public.event_speakers;

CREATE POLICY "event_speakers_select_policy" ON public.event_speakers 
  FOR SELECT USING (true);

CREATE POLICY "event_speakers_insert_policy" ON public.event_speakers 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "event_speakers_update_policy" ON public.event_speakers 
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "event_speakers_delete_policy" ON public.event_speakers 
  FOR DELETE TO authenticated USING (true);

-- Verify
SELECT 'Junction tables RLS enabled' as status;
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('event_categories', 'event_speakers')
ORDER BY tablename;
