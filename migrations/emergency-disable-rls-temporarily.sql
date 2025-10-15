-- =====================================================
-- EMERGENCY: TEMPORARILY DISABLE RLS FOR TESTING
-- =====================================================
-- This will temporarily disable RLS on event management tables
-- so we can test if the issue is with RLS policies or something else
-- =====================================================

-- Disable RLS on all event management tables
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.formats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'events', 'categories', 'formats', 'locations', 
    'organizers', 'speakers', 'event_categories',
    'event_locations', 'event_organizers', 'event_speakers'
  )
ORDER BY tablename;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. This is TEMPORARY - RLS should be re-enabled later
-- 2. Test your event creation now - it should work
-- 3. If it works, the issue is with RLS policies
-- 4. If it still fails, the issue is elsewhere
-- =====================================================

