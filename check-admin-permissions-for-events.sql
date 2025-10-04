-- =====================================================
-- CHECK ADMIN PERMISSIONS FOR EVENTS SYSTEM
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose delete issues

-- 1. Check if you have a users table with role column
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'role';

-- 2. Check your current user's role
SELECT 
    id,
    email,
    role
FROM public.users
WHERE id = auth.uid();

-- 3. If the above returns NULL or no 'admin' role, run this to give yourself admin access:
-- (Replace 'your-email@example.com' with your actual email)

-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- 4. Check current auth user ID
SELECT auth.uid() as current_user_id;

-- 5. Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('categories', 'formats', 'speakers', 'events');

-- =====================================================
-- TEMPORARY FIX: Disable RLS for testing (NOT RECOMMENDED FOR PRODUCTION)
-- =====================================================
-- Uncomment these lines ONLY for testing, then re-enable RLS after

-- ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.formats DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.speakers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organizers DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- ALTERNATIVE: Update policies to allow authenticated users (less secure but works)
-- =====================================================
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete formats" ON public.formats;
DROP POLICY IF EXISTS "Admins can delete speakers" ON public.speakers;
DROP POLICY IF EXISTS "Admins can delete locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can delete organizers" ON public.organizers;

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert formats" ON public.formats;
DROP POLICY IF EXISTS "Admins can insert speakers" ON public.speakers;
DROP POLICY IF EXISTS "Admins can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can insert organizers" ON public.organizers;

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update formats" ON public.formats;
DROP POLICY IF EXISTS "Admins can update speakers" ON public.speakers;
DROP POLICY IF EXISTS "Admins can update locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can update organizers" ON public.organizers;

-- Create new policies that allow ANY authenticated user (not just admins)
-- CATEGORIES
CREATE POLICY "Authenticated users can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categories"
    ON public.categories FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- FORMATS
CREATE POLICY "Authenticated users can insert formats"
    ON public.formats FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update formats"
    ON public.formats FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete formats"
    ON public.formats FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- SPEAKERS
CREATE POLICY "Authenticated users can insert speakers"
    ON public.speakers FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update speakers"
    ON public.speakers FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete speakers"
    ON public.speakers FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- LOCATIONS
CREATE POLICY "Authenticated users can insert locations"
    ON public.locations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update locations"
    ON public.locations FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete locations"
    ON public.locations FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- ORGANIZERS
CREATE POLICY "Authenticated users can insert organizers"
    ON public.organizers FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update organizers"
    ON public.organizers FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete organizers"
    ON public.organizers FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- EVENTS
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

CREATE POLICY "Authenticated users can insert events"
    ON public.events FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update events"
    ON public.events FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete events"
    ON public.events FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- EVENT_SPEAKERS
DROP POLICY IF EXISTS "Admins can manage event speakers" ON public.event_speakers;

CREATE POLICY "Authenticated users can manage event speakers"
    ON public.event_speakers FOR ALL
    USING (auth.uid() IS NOT NULL);

-- =====================================================
-- VERIFY THE CHANGES
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('categories', 'formats', 'speakers', 'events')
ORDER BY tablename, policyname;










