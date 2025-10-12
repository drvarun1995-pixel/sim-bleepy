-- =====================================================
-- DISABLE RLS ON ALL EVENTS TABLES
-- =====================================================
-- This script disables Row Level Security on all events-related tables
-- Run this to allow adding/editing/deleting without permission errors

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.formats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers DISABLE ROW LEVEL SECURITY;

-- Verify ALL tables have RLS disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('categories', 'formats', 'speakers', 'locations', 'organizers', 'events', 'event_speakers')
ORDER BY tablename;

-- All should show rowsecurity = false





































