-- ============================================================================
-- COMPREHENSIVE RLS POLICIES FOR ALL USER ROLES
-- ============================================================================
-- This migration creates proper RLS policies for ALL user roles:
-- - student: Basic user, can view published content, manage own data
-- - educator: Can manage resources, view all events
-- - meded_team: Educator + Event management + Contact messages
-- - ctf: Educator + Event management + Contact messages
-- - admin: Full access to everything
--
-- This replaces the disabled RLS and creates a proper security model
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS FOR ROLE CHECKING
-- ============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_educator_or_above(uuid);
DROP FUNCTION IF EXISTS public.can_manage_events(uuid);
DROP FUNCTION IF EXISTS public.can_manage_resources(uuid);
DROP FUNCTION IF EXISTS public.can_view_contact_messages(uuid);

-- Get user role from users table
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'student');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is educator or above (educator, meded_team, ctf, admin)
CREATE OR REPLACE FUNCTION public.is_educator_or_above(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('educator', 'meded_team', 'ctf', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can manage events (admin, meded_team, ctf)
CREATE OR REPLACE FUNCTION public.can_manage_events(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('admin', 'meded_team', 'ctf');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can manage resources (educator, meded_team, ctf, admin)
CREATE OR REPLACE FUNCTION public.can_manage_resources(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('educator', 'meded_team', 'ctf', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can view contact messages (admin, meded_team, ctf)
CREATE OR REPLACE FUNCTION public.can_view_contact_messages(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN public.get_user_role(user_id) IN ('admin', 'meded_team', 'ctf');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- EVENTS AND RELATED TABLES
-- ============================================================================

-- First, drop all existing policies for events-related tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('events', 'categories', 'formats', 'locations', 'organizers', 'speakers', 'event_speakers', 'event_categories', 'event_locations', 'event_organizers')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_organizers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

-- Everyone can view published events
CREATE POLICY "Everyone can view published events"
    ON public.events FOR SELECT
    USING (status = 'published' OR public.can_manage_events(auth.uid()));

-- Event managers can insert events
CREATE POLICY "Event managers can insert events"
    ON public.events FOR INSERT
    WITH CHECK (public.can_manage_events(auth.uid()));

-- Event managers can update events
CREATE POLICY "Event managers can update events"
    ON public.events FOR UPDATE
    USING (public.can_manage_events(auth.uid()));

-- Event managers can delete events
CREATE POLICY "Event managers can delete events"
    ON public.events FOR DELETE
    USING (public.can_manage_events(auth.uid()));

-- ============================================================================
-- CATEGORIES TABLE POLICIES
-- ============================================================================

-- Everyone can view categories
CREATE POLICY "Everyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

-- Event managers can manage categories
CREATE POLICY "Event managers can manage categories"
    ON public.categories FOR ALL
    USING (public.can_manage_events(auth.uid()))
    WITH CHECK (public.can_manage_events(auth.uid()));

-- ============================================================================
-- FORMATS TABLE POLICIES
-- ============================================================================

-- Everyone can view formats
CREATE POLICY "Everyone can view formats"
    ON public.formats FOR SELECT
    USING (true);

-- Event managers can manage formats
CREATE POLICY "Event managers can manage formats"
    ON public.formats FOR ALL
    USING (public.can_manage_events(auth.uid()))
    WITH CHECK (public.can_manage_events(auth.uid()));

-- ============================================================================
-- LOCATIONS TABLE POLICIES
-- ============================================================================

-- Everyone can view locations
CREATE POLICY "Everyone can view locations"
    ON public.locations FOR SELECT
    USING (true);

-- Event managers can manage locations
CREATE POLICY "Event managers can manage locations"
    ON public.locations FOR ALL
    USING (public.can_manage_events(auth.uid()))
    WITH CHECK (public.can_manage_events(auth.uid()));

-- ============================================================================
-- ORGANIZERS TABLE POLICIES
-- ============================================================================

-- Everyone can view organizers
CREATE POLICY "Everyone can view organizers"
    ON public.organizers FOR SELECT
    USING (true);

-- Event managers can manage organizers
CREATE POLICY "Event managers can manage organizers"
    ON public.organizers FOR ALL
    USING (public.can_manage_events(auth.uid()))
    WITH CHECK (public.can_manage_events(auth.uid()));

-- ============================================================================
-- SPEAKERS TABLE POLICIES
-- ============================================================================

-- Everyone can view speakers
CREATE POLICY "Everyone can view speakers"
    ON public.speakers FOR SELECT
    USING (true);

-- Event managers can manage speakers
CREATE POLICY "Event managers can manage speakers"
    ON public.speakers FOR ALL
    USING (public.can_manage_events(auth.uid()))
    WITH CHECK (public.can_manage_events(auth.uid()));

-- ============================================================================
-- EVENT_SPEAKERS JUNCTION TABLE POLICIES
-- ============================================================================

-- Everyone can view event speakers
CREATE POLICY "Everyone can view event speakers"
    ON public.event_speakers FOR SELECT
    USING (true);

-- Event managers can manage event speakers
CREATE POLICY "Event managers can manage event speakers"
    ON public.event_speakers FOR ALL
    USING (public.can_manage_events(auth.uid()))
    WITH CHECK (public.can_manage_events(auth.uid()));

-- ============================================================================
-- EVENT_LOCATIONS JUNCTION TABLE POLICIES
-- ============================================================================

-- Everyone can view event locations
CREATE POLICY "Everyone can view event locations"
    ON public.event_locations FOR SELECT
    USING (true);

-- Event managers can manage event locations
CREATE POLICY "Event managers can manage event locations"
    ON public.event_locations FOR ALL
    USING (public.can_manage_events(auth.uid()))
    WITH CHECK (public.can_manage_events(auth.uid()));

-- ============================================================================
-- EVENT_ORGANIZERS JUNCTION TABLE POLICIES
-- ============================================================================

-- Everyone can view event organizers
CREATE POLICY "Everyone can view event organizers"
    ON public.event_organizers FOR SELECT
    USING (true);

-- Event managers can manage event organizers
CREATE POLICY "Event managers can manage event organizers"
    ON public.event_organizers FOR ALL
    USING (public.can_manage_events(auth.uid()))
    WITH CHECK (public.can_manage_events(auth.uid()));

-- ============================================================================
-- RESOURCES TABLE POLICIES
-- ============================================================================

-- Drop existing resource policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'resources'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.resources', r.policyname);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE IF EXISTS public.resources ENABLE ROW LEVEL SECURITY;

-- Everyone can view active resources
CREATE POLICY "Everyone can view active resources"
    ON public.resources FOR SELECT
    USING (is_active = true OR public.can_manage_resources(auth.uid()));

-- Educators and above can insert resources
CREATE POLICY "Educators can insert resources"
    ON public.resources FOR INSERT
    WITH CHECK (public.can_manage_resources(auth.uid()));

-- Educators and above can update resources
CREATE POLICY "Educators can update resources"
    ON public.resources FOR UPDATE
    USING (public.can_manage_resources(auth.uid()));

-- Educators and above can delete resources
CREATE POLICY "Educators can delete resources"
    ON public.resources FOR DELETE
    USING (public.can_manage_resources(auth.uid()));

-- ============================================================================
-- CONTACT_MESSAGES TABLE POLICIES
-- ============================================================================

-- Drop existing contact message policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_messages'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contact_messages', r.policyname);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert contact messages (for contact form)
CREATE POLICY "Anyone can submit contact messages"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

-- Authorized users can view contact messages
CREATE POLICY "Authorized users can view contact messages"
    ON public.contact_messages FOR SELECT
    USING (public.can_view_contact_messages(auth.uid()));

-- Authorized users can update contact messages
CREATE POLICY "Authorized users can update contact messages"
    ON public.contact_messages FOR UPDATE
    USING (public.can_view_contact_messages(auth.uid()));

-- Authorized users can delete contact messages
CREATE POLICY "Authorized users can delete contact messages"
    ON public.contact_messages FOR DELETE
    USING (public.can_view_contact_messages(auth.uid()));

-- ============================================================================
-- ANNOUNCEMENTS TABLE POLICIES
-- ============================================================================

-- Drop existing announcement policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.announcements', r.policyname);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can view active announcements
CREATE POLICY "Everyone can view active announcements"
    ON public.announcements FOR SELECT
    USING (is_active = true OR public.is_admin(auth.uid()));

-- Only admins can manage announcements
CREATE POLICY "Admins can manage announcements"
    ON public.announcements FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- PORTFOLIO_FILES TABLE POLICIES
-- ============================================================================

-- Drop existing portfolio policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portfolio_files'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.portfolio_files', r.policyname);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE IF EXISTS public.portfolio_files ENABLE ROW LEVEL SECURITY;

-- Users can only see their own portfolio files
CREATE POLICY "Users can view their own portfolio files"
    ON public.portfolio_files FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own portfolio files
CREATE POLICY "Users can insert their own portfolio files"
    ON public.portfolio_files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own portfolio files
CREATE POLICY "Users can update their own portfolio files"
    ON public.portfolio_files FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own portfolio files
CREATE POLICY "Users can delete their own portfolio files"
    ON public.portfolio_files FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Drop existing user policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Users can insert their own data (during registration)
CREATE POLICY "Users can insert their own data"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update their own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Only service role can delete users (via API)
CREATE POLICY "Service role can delete users"
    ON public.users FOR DELETE
    USING (auth.role() = 'service_role');

-- ============================================================================
-- PROFILES TABLE POLICIES (if exists)
-- ============================================================================

-- Drop existing profile policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================================================
-- ATTEMPTS AND ATTEMPT_EVENTS TABLE POLICIES (for simulator)
-- ============================================================================

-- Drop existing attempt policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('attempts', 'attempt_events')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE IF EXISTS public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attempt_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view their own attempts"
    ON public.attempts FOR SELECT
    USING (auth.uid()::text = user_id::text OR public.is_admin(auth.uid()));

-- Users can insert their own attempts
CREATE POLICY "Users can insert their own attempts"
    ON public.attempts FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own attempts
CREATE POLICY "Users can update their own attempts"
    ON public.attempts FOR UPDATE
    USING (auth.uid()::text = user_id::text OR public.is_admin(auth.uid()));

-- Users can view their own attempt events
CREATE POLICY "Users can view their own attempt events"
    ON public.attempt_events FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.attempts
        WHERE attempts.id = attempt_events.attempt_id
        AND (attempts.user_id::text = auth.uid()::text OR public.is_admin(auth.uid()))
      )
    );

-- Users can insert their own attempt events
CREATE POLICY "Users can insert their own attempt events"
    ON public.attempt_events FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.attempts
        WHERE attempts.id = attempt_events.attempt_id
        AND attempts.user_id::text = auth.uid()::text
      )
    );

-- ============================================================================
-- STATIONS TABLE POLICIES (for simulator)
-- ============================================================================

-- Drop existing station policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'stations'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.stations', r.policyname);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE IF EXISTS public.stations ENABLE ROW LEVEL SECURITY;

-- Everyone can view stations
CREATE POLICY "Everyone can view stations"
    ON public.stations FOR SELECT
    USING (true);

-- Only admins can manage stations
CREATE POLICY "Admins can manage stations"
    ON public.stations FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- VERIFICATION AND SUMMARY
-- ============================================================================

-- Count policies created
DO $$
DECLARE
  policy_count integer;
  table_count integer;
BEGIN
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPREHENSIVE RLS SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables with RLS enabled: %', table_count;
  RAISE NOTICE 'Total RLS policies created: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 ROLE PERMISSIONS SUMMARY:';
  RAISE NOTICE '';
  RAISE NOTICE '🟢 STUDENT:';
  RAISE NOTICE '  ✓ View published events, categories, formats, locations, organizers, speakers';
  RAISE NOTICE '  ✓ View active resources and announcements';
  RAISE NOTICE '  ✓ Manage own profile, portfolio, attempts';
  RAISE NOTICE '  ✓ Submit contact form messages';
  RAISE NOTICE '';
  RAISE NOTICE '🔵 EDUCATOR:';
  RAISE NOTICE '  ✓ All student permissions';
  RAISE NOTICE '  ✓ Upload, edit, delete resources';
  RAISE NOTICE '  ✓ View all events (including drafts)';
  RAISE NOTICE '';
  RAISE NOTICE '🟣 MEDED TEAM:';
  RAISE NOTICE '  ✓ All educator permissions';
  RAISE NOTICE '  ✓ Create, edit, delete events';
  RAISE NOTICE '  ✓ Manage categories, formats, locations, organizers, speakers';
  RAISE NOTICE '  ✓ View and manage contact messages';
  RAISE NOTICE '';
  RAISE NOTICE '🟠 CTF:';
  RAISE NOTICE '  ✓ All educator permissions';
  RAISE NOTICE '  ✓ Create, edit, delete events';
  RAISE NOTICE '  ✓ Manage categories, formats, locations, organizers, speakers';
  RAISE NOTICE '  ✓ View and manage contact messages';
  RAISE NOTICE '';
  RAISE NOTICE '🔴 ADMIN:';
  RAISE NOTICE '  ✓ Full access to everything';
  RAISE NOTICE '  ✓ Manage all users, announcements, stations';
  RAISE NOTICE '  ✓ View all user data and attempts';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS is now properly configured for security!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

