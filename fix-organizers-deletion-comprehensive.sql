-- =====================================================
-- COMPREHENSIVE FIX FOR ORGANIZER DELETION ISSUE
-- =====================================================
-- This script addresses all potential causes of organizer deletion failures
-- Run this in your Supabase SQL Editor

-- Step 1: Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('organizers', 'event_organizers', 'locations', 'event_locations', 'events')
ORDER BY tablename;

-- Step 2: Disable RLS on all related tables
ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_locations DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies on these tables (if any)
-- This ensures no old policies interfere

-- Drop policies on organizers
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organizers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.organizers;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.organizers;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.organizers;
DROP POLICY IF EXISTS "Allow public read access" ON public.organizers;
DROP POLICY IF EXISTS "Allow authenticated users to manage" ON public.organizers;

-- Drop policies on event_organizers
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_organizers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.event_organizers;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.event_organizers;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.event_organizers;
DROP POLICY IF EXISTS "Allow public read access" ON public.event_organizers;
DROP POLICY IF EXISTS "Allow authenticated users to manage" ON public.event_organizers;

-- Drop policies on locations
DROP POLICY IF EXISTS "Enable read access for all users" ON public.locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.locations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.locations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.locations;
DROP POLICY IF EXISTS "Allow public read access" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated users to manage" ON public.locations;

-- Drop policies on event_locations
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.event_locations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.event_locations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.event_locations;
DROP POLICY IF EXISTS "Allow public read access" ON public.event_locations;
DROP POLICY IF EXISTS "Allow authenticated users to manage" ON public.event_locations;

-- Step 4: Grant full permissions to authenticated users
GRANT ALL ON public.organizers TO authenticated;
GRANT ALL ON public.event_organizers TO authenticated;
GRANT ALL ON public.locations TO authenticated;
GRANT ALL ON public.event_locations TO authenticated;

-- Grant to anon as well (for public access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_organizers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_locations TO anon;

-- Grant to service_role (for admin operations)
GRANT ALL ON public.organizers TO service_role;
GRANT ALL ON public.event_organizers TO service_role;
GRANT ALL ON public.locations TO service_role;
GRANT ALL ON public.event_locations TO service_role;

-- Step 5: Verify the changes
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('organizers', 'event_organizers', 'locations', 'event_locations')
ORDER BY tablename;

-- Step 6: Test organizer deletion
-- Run this to see if there are any organizers that can be tested
SELECT id, name FROM public.organizers LIMIT 5;

-- Step 7: Check for any foreign key constraints that might prevent deletion
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name IN ('event_organizers', 'organizers'))
ORDER BY tc.table_name;

-- Step 8: Check if there are any triggers that might interfere
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('organizers', 'event_organizers', 'locations', 'event_locations')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- After running this script, you should see:
-- 1. All tables show "RLS Enabled" = false
-- 2. Foreign key constraints show DELETE CASCADE or SET NULL
-- 3. No blocking triggers exist
--
-- If organizers still won't delete, check:
-- - Browser console for JavaScript errors
-- - Network tab to see the actual API request/response
-- - Supabase logs for any database errors
-- =====================================================

-- =====================================================
-- TROUBLESHOOTING QUERIES:
-- =====================================================

-- Check if there are orphaned records in event_organizers
-- SELECT eo.*, e.title as event_title, o.name as organizer_name
-- FROM event_organizers eo
-- LEFT JOIN events e ON eo.event_id = e.id
-- LEFT JOIN organizers o ON eo.organizer_id = o.id
-- WHERE e.id IS NULL OR o.id IS NULL;

-- Check events with their organizers
-- SELECT 
--     e.id,
--     e.title,
--     e.organizer_id,
--     o.name as primary_organizer,
--     array_agg(eo_org.name) as other_organizers
-- FROM events e
-- LEFT JOIN organizers o ON e.organizer_id = o.id
-- LEFT JOIN event_organizers eo ON e.id = eo.event_id
-- LEFT JOIN organizers eo_org ON eo.organizer_id = eo_org.id
-- GROUP BY e.id, e.title, e.organizer_id, o.name
-- LIMIT 10;






















