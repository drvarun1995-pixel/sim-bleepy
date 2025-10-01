-- =====================================================
-- FIX ORGANIZERS DELETE ISSUE
-- =====================================================

-- Disable Row Level Security on organizers table
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;

-- Also disable for locations (in case you need it)
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('organizers', 'locations')
ORDER BY tablename;

-- You should see rowsecurity = false for both tables



