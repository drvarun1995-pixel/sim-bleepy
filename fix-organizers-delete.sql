-- =====================================================
-- FIX ORGANIZERS DELETE ISSUE
-- =====================================================

-- Disable Row Level Security on organizers table and related tables
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizers DISABLE ROW LEVEL SECURITY;

-- Also disable for locations (in case you need it)
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_locations DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('organizers', 'event_organizers', 'locations', 'event_locations')
ORDER BY tablename;

-- You should see rowsecurity = false for all tables

-- Note: Run this SQL in your Supabase SQL editor to fix the organizer deletion issue















