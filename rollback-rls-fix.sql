-- =====================================================
-- ROLLBACK SCRIPT FOR RLS FIXES
-- =====================================================
-- Use this if the RLS fixes cause any issues
-- This will restore the previous state

-- Disable RLS on all tables (restore previous state)
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.formats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers DISABLE ROW LEVEL SECURITY;
-- Note: Keep users table RLS enabled as it was working before

-- Drop all the policies we created
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;

DROP POLICY IF EXISTS "event_categories_select_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_insert_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_update_policy" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_delete_policy" ON public.event_categories;

DROP POLICY IF EXISTS "event_speakers_select_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_insert_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_update_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_delete_policy" ON public.event_speakers;

DROP POLICY IF EXISTS "formats_select_policy" ON public.formats;
DROP POLICY IF EXISTS "formats_insert_policy" ON public.formats;
DROP POLICY IF EXISTS "formats_update_policy" ON public.formats;
DROP POLICY IF EXISTS "formats_delete_policy" ON public.formats;

DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_update_policy" ON public.locations;
DROP POLICY IF EXISTS "locations_delete_policy" ON public.locations;

DROP POLICY IF EXISTS "organizers_select_policy" ON public.organizers;
DROP POLICY IF EXISTS "organizers_insert_policy" ON public.organizers;
DROP POLICY IF EXISTS "organizers_update_policy" ON public.organizers;
DROP POLICY IF EXISTS "organizers_delete_policy" ON public.organizers;

DROP POLICY IF EXISTS "speakers_select_policy" ON public.speakers;
DROP POLICY IF EXISTS "speakers_insert_policy" ON public.speakers;
DROP POLICY IF EXISTS "speakers_update_policy" ON public.speakers;
DROP POLICY IF EXISTS "speakers_delete_policy" ON public.speakers;

-- Verify rollback
SELECT 'Rollback Complete - RLS disabled on all tables' as status;
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'categories', 'event_categories', 'event_speakers', 
    'formats', 'locations', 'organizers', 'speakers'
  )
ORDER BY tablename;
