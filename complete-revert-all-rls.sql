-- =====================================================
-- COMPLETE REVERT - DISABLE ALL RLS
-- =====================================================
-- This will disable RLS on ALL tables to restore full functionality

-- Disable RLS on ALL tables
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.formats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on any other tables that might have it enabled
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations DISABLE ROW LEVEL SECURITY;

-- Verify ALL tables have RLS disabled
SELECT 'Complete RLS Status After Revert:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = true
ORDER BY tablename;

SELECT 'COMPLETE REVERT DONE - All RLS Disabled!' as status;
SELECT 'Your educator dashboard should now be fully restored!' as note;
