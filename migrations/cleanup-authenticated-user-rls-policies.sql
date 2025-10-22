-- =====================================================
-- CLEANUP: Remove Broken Authenticated User RLS Policies
-- =====================================================
-- These policies don't work with NextAuth because they check for
-- Supabase JWT tokens which don't exist in our NextAuth setup.
-- 
-- We're keeping RLS ENABLED with service role policies.
-- Authorization now happens in API routes with NextAuth.
-- =====================================================

-- =====================================================
-- 1. REMOVE AUTHENTICATED USER POLICIES FOR EVENTS
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;

-- =====================================================
-- 2. REMOVE AUTHENTICATED USER POLICIES FOR CATEGORIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;

-- =====================================================
-- 3. REMOVE AUTHENTICATED USER POLICIES FOR FORMATS
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert formats" ON public.formats;
DROP POLICY IF EXISTS "Authenticated users can update formats" ON public.formats;
DROP POLICY IF EXISTS "Authenticated users can delete formats" ON public.formats;

-- =====================================================
-- 4. REMOVE AUTHENTICATED USER POLICIES FOR LOCATIONS
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON public.locations;

-- =====================================================
-- 5. REMOVE AUTHENTICATED USER POLICIES FOR ORGANIZERS
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert organizers" ON public.organizers;
DROP POLICY IF EXISTS "Authenticated users can update organizers" ON public.organizers;
DROP POLICY IF EXISTS "Authenticated users can delete organizers" ON public.organizers;

-- =====================================================
-- 6. REMOVE AUTHENTICATED USER POLICIES FOR SPEAKERS
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert speakers" ON public.speakers;
DROP POLICY IF EXISTS "Authenticated users can update speakers" ON public.speakers;
DROP POLICY IF EXISTS "Authenticated users can delete speakers" ON public.speakers;

-- =====================================================
-- 7. REMOVE AUTHENTICATED USER POLICIES FOR JUNCTION TABLES
-- =====================================================

-- Event Categories
DROP POLICY IF EXISTS "Authenticated users can insert event_categories" ON public.event_categories;
DROP POLICY IF EXISTS "Authenticated users can delete event_categories" ON public.event_categories;

-- Event Locations
DROP POLICY IF EXISTS "Authenticated users can insert event_locations" ON public.event_locations;
DROP POLICY IF EXISTS "Authenticated users can delete event_locations" ON public.event_locations;

-- Event Organizers
DROP POLICY IF EXISTS "Authenticated users can insert event_organizers" ON public.event_organizers;
DROP POLICY IF EXISTS "Authenticated users can delete event_organizers" ON public.event_organizers;

-- Event Speakers
DROP POLICY IF EXISTS "Authenticated users can insert event_speakers" ON public.event_speakers;
DROP POLICY IF EXISTS "Authenticated users can delete event_speakers" ON public.event_speakers;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check remaining policies (should only be service role policies)
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'events', 'categories', 'formats', 'locations', 
    'organizers', 'speakers', 'event_categories',
    'event_locations', 'event_organizers', 'event_speakers'
  )
ORDER BY tablename, policyname;

-- Verify RLS is still enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
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
-- NOTES
-- =====================================================
-- 
-- ✅ RLS remains ENABLED on all tables
-- ✅ Service role policies remain (for API access)
-- ❌ Authenticated user policies removed (don't work with NextAuth)
-- ✅ Authorization now handled in API routes with NextAuth
--
-- This is the correct, secure approach for NextAuth + Supabase!
-- =====================================================






























