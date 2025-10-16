-- =====================================================
-- FIX GAMIFICATION RLS POLICIES (CORRECTED)
-- =====================================================
-- This script enables RLS on gamification tables that exist
-- and creates service role policies to allow the backend API
-- to manage gamification (XP, achievements, streaks, etc.)
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON GAMIFICATION TABLES (IF THEY EXIST)
-- =====================================================

-- Check and enable RLS only on tables that exist
DO $$
BEGIN
    -- user_levels
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_levels') THEN
        ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on user_levels';
    END IF;

    -- xp_transactions
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'xp_transactions') THEN
        ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on xp_transactions';
    END IF;

    -- achievements
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements') THEN
        ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on achievements';
    END IF;

    -- user_achievements
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_achievements') THEN
        ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on user_achievements';
    END IF;

    -- user_streaks
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_streaks') THEN
        ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on user_streaks';
    END IF;

    -- skills (only if exists)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'skills') THEN
        ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on skills';
    END IF;

    -- user_skills (only if exists)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_skills') THEN
        ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on user_skills';
    END IF;
END $$;

-- =====================================================
-- 2. CREATE SERVICE ROLE POLICIES (ONLY FOR EXISTING TABLES)
-- =====================================================

-- user_levels
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_levels') THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.user_levels;
        CREATE POLICY "Service role full access"
          ON public.user_levels FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
        RAISE NOTICE 'Policy created for user_levels';
    END IF;
END $$;

-- xp_transactions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'xp_transactions') THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.xp_transactions;
        CREATE POLICY "Service role full access"
          ON public.xp_transactions FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
        RAISE NOTICE 'Policy created for xp_transactions';
    END IF;
END $$;

-- achievements
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements') THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.achievements;
        CREATE POLICY "Service role full access"
          ON public.achievements FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
        RAISE NOTICE 'Policy created for achievements';
    END IF;
END $$;

-- user_achievements
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_achievements') THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.user_achievements;
        CREATE POLICY "Service role full access"
          ON public.user_achievements FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
        RAISE NOTICE 'Policy created for user_achievements';
    END IF;
END $$;

-- user_streaks
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_streaks') THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.user_streaks;
        CREATE POLICY "Service role full access"
          ON public.user_streaks FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
        RAISE NOTICE 'Policy created for user_streaks';
    END IF;
END $$;

-- skills (only if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'skills') THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.skills;
        CREATE POLICY "Service role full access"
          ON public.skills FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
        RAISE NOTICE 'Policy created for skills';
    END IF;
END $$;

-- user_skills (only if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_skills') THEN
        DROP POLICY IF EXISTS "Service role full access" ON public.user_skills;
        CREATE POLICY "Service role full access"
          ON public.user_skills FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
        RAISE NOTICE 'Policy created for user_skills';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Check that RLS is enabled on existing tables
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_levels', 'xp_transactions', 'achievements', 
    'user_achievements', 'user_streaks', 'skills', 'user_skills'
  )
ORDER BY tablename;

-- Check that policies were created
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_levels', 'xp_transactions', 'achievements', 
    'user_achievements', 'user_streaks', 'skills', 'user_skills'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- This corrected version checks if tables exist before:
-- - Enabling RLS
-- - Creating policies
-- 
-- This prevents errors if some gamification tables don't exist yet.
-- 
-- ✅ RLS is ENABLED on existing gamification tables
-- ✅ Service role (backend API) can access tables
-- ✅ Gamification functions (award_xp, etc.) will work
-- ✅ Leaderboard will update when users complete scenarios
-- ✅ Security is maintained - only backend can manage gamification
--
-- =====================================================







