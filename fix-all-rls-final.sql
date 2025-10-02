-- FINAL FIX FOR ALL RLS POLICIES
-- This comprehensively fixes all tables involved in events

-- =====================================================
-- EVENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Allow everyone to read events" ON public.events;
DROP POLICY IF EXISTS "Allow public to read events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to insert events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to update all events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to delete all events" ON public.events;

CREATE POLICY "events_select_policy" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert_policy" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "events_update_policy" ON public.events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "events_delete_policy" ON public.events FOR DELETE TO authenticated USING (true);

-- =====================================================
-- EVENT_CATEGORIES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Allow public to read event_categories" ON public.event_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage event_categories" ON public.event_categories;
DROP POLICY IF EXISTS "Allow public read access" ON public.event_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage" ON public.event_categories;

CREATE POLICY "event_categories_select_policy" ON public.event_categories FOR SELECT USING (true);
CREATE POLICY "event_categories_insert_policy" ON public.event_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "event_categories_update_policy" ON public.event_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "event_categories_delete_policy" ON public.event_categories FOR DELETE TO authenticated USING (true);

-- =====================================================
-- EVENT_SPEAKERS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Allow public to read event_speakers" ON public.event_speakers;
DROP POLICY IF EXISTS "Allow authenticated users to manage event_speakers" ON public.event_speakers;
DROP POLICY IF EXISTS "Allow public read access on event_speakers" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_select_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_insert_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_update_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_delete_policy" ON public.event_speakers;

CREATE POLICY "event_speakers_select_policy" ON public.event_speakers FOR SELECT USING (true);
CREATE POLICY "event_speakers_insert_policy" ON public.event_speakers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "event_speakers_update_policy" ON public.event_speakers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "event_speakers_delete_policy" ON public.event_speakers FOR DELETE TO authenticated USING (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'RLS Policies Fixed!' as status;
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('events', 'event_categories', 'event_speakers')
ORDER BY tablename, cmd, policyname;

