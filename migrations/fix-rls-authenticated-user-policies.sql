-- =====================================================
-- FIX RLS POLICIES FOR AUTHENTICATED USER OPERATIONS
-- =====================================================
-- This script adds INSERT/UPDATE/DELETE policies for authenticated users
-- to allow event management operations from the frontend.
--
-- PROBLEM: The previous RLS fix only added service role policies,
-- but the frontend uses client-side Supabase which runs as authenticated users.
-- This caused INSERT/UPDATE/DELETE operations to fail with RLS violations.
--
-- SOLUTION: Add policies that allow authenticated users with proper roles
-- to perform these operations.
-- =====================================================

-- =====================================================
-- 1. EVENTS TABLE - Allow authenticated users to manage events
-- =====================================================

-- Allow authenticated users with proper roles to INSERT events
CREATE POLICY "Authenticated users can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is admin, educator, or meded
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- Allow authenticated users with proper roles to UPDATE events
CREATE POLICY "Authenticated users can update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    -- Allow if user is admin, educator, or meded
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  )
  WITH CHECK (
    -- Allow if user is admin, educator, or meded
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- Allow authenticated users with proper roles to DELETE events
CREATE POLICY "Authenticated users can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    -- Allow if user is admin, educator, or meded
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- =====================================================
-- 2. CATEGORIES TABLE - Allow authenticated users to manage categories
-- =====================================================

CREATE POLICY "Authenticated users can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- =====================================================
-- 3. FORMATS TABLE - Allow authenticated users to manage formats
-- =====================================================

CREATE POLICY "Authenticated users can insert formats"
  ON public.formats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can update formats"
  ON public.formats FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete formats"
  ON public.formats FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- =====================================================
-- 4. LOCATIONS TABLE - Allow authenticated users to manage locations
-- =====================================================

CREATE POLICY "Authenticated users can insert locations"
  ON public.locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can update locations"
  ON public.locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete locations"
  ON public.locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- =====================================================
-- 5. ORGANIZERS TABLE - Allow authenticated users to manage organizers
-- =====================================================

CREATE POLICY "Authenticated users can insert organizers"
  ON public.organizers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can update organizers"
  ON public.organizers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete organizers"
  ON public.organizers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- =====================================================
-- 6. SPEAKERS TABLE - Allow authenticated users to manage speakers
-- =====================================================

CREATE POLICY "Authenticated users can insert speakers"
  ON public.speakers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can update speakers"
  ON public.speakers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete speakers"
  ON public.speakers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- =====================================================
-- 7. JUNCTION TABLES - Allow authenticated users to manage relationships
-- =====================================================

-- Event Categories Junction
CREATE POLICY "Authenticated users can insert event_categories"
  ON public.event_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete event_categories"
  ON public.event_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- Event Formats Junction
CREATE POLICY "Authenticated users can insert event_formats"
  ON public.event_formats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete event_formats"
  ON public.event_formats FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- Event Locations Junction
CREATE POLICY "Authenticated users can insert event_locations"
  ON public.event_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete event_locations"
  ON public.event_locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- Event Organizers Junction
CREATE POLICY "Authenticated users can insert event_organizers"
  ON public.event_organizers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete event_organizers"
  ON public.event_organizers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- Event Speakers Junction
CREATE POLICY "Authenticated users can insert event_speakers"
  ON public.event_speakers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete event_speakers"
  ON public.event_speakers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- =====================================================
-- 8. RESOURCES TABLE - Allow authenticated users to manage resources
-- =====================================================

CREATE POLICY "Authenticated users can insert resources"
  ON public.resources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can update resources"
  ON public.resources FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

CREATE POLICY "Authenticated users can delete resources"
  ON public.resources FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded', 'ctf')
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that all policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'events', 'categories', 'formats', 'locations', 'organizers', 'speakers',
    'event_categories', 'event_formats', 'event_locations', 'event_organizers', 'event_speakers',
    'resources'
  )
  AND policyname LIKE 'Authenticated users%'
ORDER BY tablename, cmd, policyname;

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- This fix maintains security while allowing proper functionality:
--
-- 1. Only users with roles: admin, educator, meded, ctf can manage events
-- 2. Regular students cannot create/edit/delete events
-- 3. Service role policies still exist for API operations
-- 4. This allows the frontend event management interface to work
-- 5. The policies check the user's role from the users table
--
-- IMPORTANT: These policies rely on NextAuth JWT containing the user's email
-- The policies look up the user's role from the users table based on email
-- =====================================================
















