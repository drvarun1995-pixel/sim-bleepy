-- =====================================================
-- FIX EVENTS PERMISSIONS - ALLOW ADDING/EDITING EVENTS
-- =====================================================

-- Disable Row Level Security on events table
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- Also disable on event_speakers junction table
ALTER TABLE public.event_speakers DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('events', 'event_speakers')
ORDER BY tablename;

-- You should see rowsecurity = false for both tables

-- Now you'll be able to add, edit, and delete events!

































