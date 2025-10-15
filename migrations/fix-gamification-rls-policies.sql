-- =====================================================
-- FIX GAMIFICATION RLS POLICIES
-- =====================================================
-- This script enables RLS on gamification tables and creates
-- service role policies to allow the backend API to manage
-- gamification (XP, achievements, streaks, etc.)
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON GAMIFICATION TABLES
-- =====================================================

ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE SERVICE ROLE POLICIES
-- =====================================================

-- user_levels
DROP POLICY IF EXISTS "Service role full access" ON public.user_levels;
CREATE POLICY "Service role full access"
  ON public.user_levels FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- xp_transactions
DROP POLICY IF EXISTS "Service role full access" ON public.xp_transactions;
CREATE POLICY "Service role full access"
  ON public.xp_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- achievements
DROP POLICY IF EXISTS "Service role full access" ON public.achievements;
CREATE POLICY "Service role full access"
  ON public.achievements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- user_achievements
DROP POLICY IF EXISTS "Service role full access" ON public.user_achievements;
CREATE POLICY "Service role full access"
  ON public.user_achievements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- user_streaks
DROP POLICY IF EXISTS "Service role full access" ON public.user_streaks;
CREATE POLICY "Service role full access"
  ON public.user_streaks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- skills
DROP POLICY IF EXISTS "Service role full access" ON public.skills;
CREATE POLICY "Service role full access"
  ON public.skills FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- user_skills
DROP POLICY IF EXISTS "Service role full access" ON public.user_skills;
CREATE POLICY "Service role full access"
  ON public.user_skills FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Check that RLS is enabled
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
-- This fix allows the gamification system to work properly:
-- 
-- ✅ RLS is ENABLED on all gamification tables
-- ✅ Service role (backend API) can access tables
-- ✅ Gamification functions (award_xp, etc.) will work
-- ✅ Leaderboard will update when users complete scenarios
-- ✅ Security is maintained - only backend can manage gamification
--
-- =====================================================


