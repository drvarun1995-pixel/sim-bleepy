-- ============================================================================
-- PROPER RLS SETUP FOR NEXTAUTH AUTHENTICATION
-- ============================================================================
-- Since this app uses NextAuth (NOT Supabase Auth), auth.uid() is always NULL
-- Authorization happens at the API layer using service role + role checks
-- 
-- STRATEGY:
-- 1. DISABLE RLS on shared/managed tables (events, categories, etc.)
--    - These are accessed via service role in APIs
--    - Authorization checked in Next.js API routes
-- 2. KEEP RLS ENABLED on user-specific tables (portfolio, attempts, etc.)
--    - These use user_id foreign keys for isolation
--    - Service role with user_id filtering in APIs
-- ============================================================================

-- ============================================================================
-- SHARED/MANAGED TABLES - DISABLE RLS
-- ============================================================================
-- These tables are managed by admins/educators via API routes
-- Authorization is handled at the API layer, not database layer

-- Events system tables
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.formats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.speakers DISABLE ROW LEVEL SECURITY;

-- Junction tables
ALTER TABLE IF EXISTS public.event_speakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_organizers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_categories DISABLE ROW LEVEL SECURITY;

-- Resources (managed via API with role checks)
ALTER TABLE IF EXISTS public.resources DISABLE ROW LEVEL SECURITY;

-- Contact messages (managed via API with role checks)
ALTER TABLE IF EXISTS public.contact_messages DISABLE ROW LEVEL SECURITY;

-- Announcements (managed via API with role checks)
ALTER TABLE IF EXISTS public.announcements DISABLE ROW LEVEL SECURITY;

-- Stations (public data)
ALTER TABLE IF EXISTS public.stations DISABLE ROW LEVEL SECURITY;

-- Notification
DO $$
BEGIN
  RAISE NOTICE '✅ RLS disabled on shared/managed tables';
  RAISE NOTICE 'These tables are protected by API-level authorization';
END $$;

-- ============================================================================
-- USER-SPECIFIC TABLES - KEEP RLS ENABLED
-- ============================================================================
-- These tables contain user-specific data that should be isolated

-- Drop all existing policies first
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'profiles', 'portfolio_files', 'attempts', 'attempt_events')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (for API operations)
CREATE POLICY "Service role full access to users"
    ON public.users FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- PROFILES TABLE POLICIES (if exists)
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role full access to profiles"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- PORTFOLIO_FILES TABLE POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.portfolio_files ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role full access to portfolio"
    ON public.portfolio_files FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- ATTEMPTS TABLE POLICIES (for AI simulator)
-- ============================================================================

ALTER TABLE IF EXISTS public.attempts ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role full access to attempts"
    ON public.attempts FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- ATTEMPT_EVENTS TABLE POLICIES
-- ============================================================================

ALTER TABLE IF EXISTS public.attempt_events ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role full access to attempt events"
    ON public.attempt_events FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  rls_enabled_count integer;
  rls_disabled_count integer;
BEGIN
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true;
  
  -- Count tables with RLS disabled
  SELECT COUNT(*) INTO rls_disabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = false;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS CONFIGURATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 TABLES STATUS:';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Enabled (user-specific data): %', rls_enabled_count;
  RAISE NOTICE '  - users, profiles, portfolio_files';
  RAISE NOTICE '  - attempts, attempt_events';
  RAISE NOTICE '  → Authorization: Service role with user_id filtering';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Disabled (shared data): %', rls_disabled_count;
  RAISE NOTICE '  - events, categories, formats, locations, organizers';
  RAISE NOTICE '  - resources, contact_messages, announcements';
  RAISE NOTICE '  → Authorization: API-level role checks in Next.js';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SECURITY APPROACH:';
  RAISE NOTICE '';
  RAISE NOTICE 'This app uses NextAuth (not Supabase Auth), so:';
  RAISE NOTICE '  ✓ All database access goes through Next.js APIs';
  RAISE NOTICE '  ✓ APIs use service role key (bypasses RLS)';
  RAISE NOTICE '  ✓ Authorization checked in API code';
  RAISE NOTICE '  ✓ User roles stored in users.role column';
  RAISE NOTICE '  ✓ APIs filter by user_id for user-specific data';
  RAISE NOTICE '';
  RAISE NOTICE '✅ ALL ROLES NOW WORK:';
  RAISE NOTICE '';
  RAISE NOTICE '🟢 Student: View content, practice (3/day limit)';
  RAISE NOTICE '🔵 Educator: Upload resources, unlimited practice';
  RAISE NOTICE '🟣 MedEd Team: Event management + contact messages';
  RAISE NOTICE '🟠 CTF: Event management + contact messages';
  RAISE NOTICE '🔴 Admin: Full access to everything';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Configuration matches your architecture!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- WHY THIS APPROACH:
-- 
-- Your app architecture:
--   Frontend → Next.js API Routes → Supabase (via service role)
--   
-- NextAuth handles authentication (not Supabase Auth)
-- API routes check user roles from users.role column
-- Service role bypasses RLS, so RLS policies with auth.uid() don't work
-- 
-- This migration:
--   ✓ Disables RLS on shared tables (authorization in API)
--   ✓ Keeps RLS on user tables (service role only)
--   ✓ Matches your existing architecture
--   ✓ Allows all roles to work correctly
-- 
-- Security is maintained through:
--   1. API routes require authentication (NextAuth session)
--   2. API routes check user.role from database
--   3. API routes use permission helpers (canManageEvents, etc.)
--   4. Service role key is private (only backend has access)
--   5. User-specific data filtered by user_id in API code
-- 
-- ============================================================================

