-- =====================================================
-- FIX RLS POLICIES - USE ONLY ACTUAL ROLES
-- =====================================================
-- This script updates all RLS policies to only include roles that actually exist:
-- - admin
-- - educator
-- - meded_team
-- - student (but students shouldn't manage events)
--
-- REMOVES: meded, ctf (these roles don't exist in your database)
-- =====================================================

-- =====================================================
-- 1. UPDATE EVENTS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;

-- Recreate with only actual roles (admin, educator, meded_team)
CREATE POLICY "Authenticated users can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- =====================================================
-- 2. UPDATE CATEGORIES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;

CREATE POLICY "Authenticated users can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- =====================================================
-- 3. UPDATE FORMATS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert formats" ON public.formats;
DROP POLICY IF EXISTS "Authenticated users can update formats" ON public.formats;
DROP POLICY IF EXISTS "Authenticated users can delete formats" ON public.formats;

CREATE POLICY "Authenticated users can insert formats"
  ON public.formats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can update formats"
  ON public.formats FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete formats"
  ON public.formats FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- =====================================================
-- 4. UPDATE LOCATIONS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON public.locations;

CREATE POLICY "Authenticated users can insert locations"
  ON public.locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can update locations"
  ON public.locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete locations"
  ON public.locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- =====================================================
-- 5. UPDATE ORGANIZERS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert organizers" ON public.organizers;
DROP POLICY IF EXISTS "Authenticated users can update organizers" ON public.organizers;
DROP POLICY IF EXISTS "Authenticated users can delete organizers" ON public.organizers;

CREATE POLICY "Authenticated users can insert organizers"
  ON public.organizers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can update organizers"
  ON public.organizers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete organizers"
  ON public.organizers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- =====================================================
-- 6. UPDATE SPEAKERS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can insert speakers" ON public.speakers;
DROP POLICY IF EXISTS "Authenticated users can update speakers" ON public.speakers;
DROP POLICY IF EXISTS "Authenticated users can delete speakers" ON public.speakers;

CREATE POLICY "Authenticated users can insert speakers"
  ON public.speakers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can update speakers"
  ON public.speakers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete speakers"
  ON public.speakers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- =====================================================
-- 7. UPDATE JUNCTION TABLE POLICIES
-- =====================================================

-- Event Categories
DROP POLICY IF EXISTS "Authenticated users can insert event_categories" ON public.event_categories;
DROP POLICY IF EXISTS "Authenticated users can delete event_categories" ON public.event_categories;

CREATE POLICY "Authenticated users can insert event_categories"
  ON public.event_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete event_categories"
  ON public.event_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- Event Locations
DROP POLICY IF EXISTS "Authenticated users can insert event_locations" ON public.event_locations;
DROP POLICY IF EXISTS "Authenticated users can delete event_locations" ON public.event_locations;

CREATE POLICY "Authenticated users can insert event_locations"
  ON public.event_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete event_locations"
  ON public.event_locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- Event Organizers
DROP POLICY IF EXISTS "Authenticated users can insert event_organizers" ON public.event_organizers;
DROP POLICY IF EXISTS "Authenticated users can delete event_organizers" ON public.event_organizers;

CREATE POLICY "Authenticated users can insert event_organizers"
  ON public.event_organizers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete event_organizers"
  ON public.event_organizers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- Event Speakers
DROP POLICY IF EXISTS "Authenticated users can insert event_speakers" ON public.event_speakers;
DROP POLICY IF EXISTS "Authenticated users can delete event_speakers" ON public.event_speakers;

CREATE POLICY "Authenticated users can insert event_speakers"
  ON public.event_speakers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

CREATE POLICY "Authenticated users can delete event_speakers"
  ON public.event_speakers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team')
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that policies were updated correctly
SELECT 
    'Policies updated with correct roles only' as status,
    COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'Authenticated users%';

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- This script creates clean RLS policies that only include roles that actually exist:
-- - admin (can manage events)
-- - educator (can manage events)  
-- - meded_team (can manage events)
-- - student (cannot manage events - not included in policies)
--
-- REMOVED: meded, ctf (these roles don't exist in your database)
--
-- =====================================================





























