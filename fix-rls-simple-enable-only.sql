-- =====================================================
-- SIMPLE RLS ENABLE - KEEP EXISTING POLICIES
-- =====================================================
-- This just enables RLS on tables that have policies but RLS disabled
-- Your existing policies are good, so we keep them!

-- Enable RLS on tables that have policies but RLS disabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;

-- Users table should already have RLS enabled, but let's make sure
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT 'RLS Status After Enable:' as info;
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

-- Show that policies are still there
SELECT 'Policies Still Active:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'categories', 'event_categories', 'event_speakers', 
        'formats', 'locations', 'organizers', 'speakers', 'users'
    )
ORDER BY tablename, cmd, policyname;

SELECT 'RLS Enabled Successfully!' as status;
SELECT 'Your existing policies are now active and enforced' as note;
