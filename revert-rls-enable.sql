-- =====================================================
-- REVERT RLS ENABLE - RESTORE PREVIOUS STATE
-- =====================================================
-- This will disable RLS on all tables to restore functionality

-- Disable RLS on all the tables we enabled
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.formats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers DISABLE ROW LEVEL SECURITY;

-- Keep users table RLS enabled (it was working before)
-- Don't disable users table RLS as it was already enabled

-- Verify the revert
SELECT 'RLS Status After Revert:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'categories', 'event_categories', 'event_speakers', 
        'formats', 'locations', 'organizers', 'speakers', 'users'
    )
ORDER BY tablename;

SELECT 'Revert Complete - Educator Dashboard Should Be Restored!' as status;
