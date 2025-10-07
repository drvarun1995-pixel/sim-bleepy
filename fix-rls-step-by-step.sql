-- =====================================================
-- STEP-BY-STEP RLS SECURITY FIX
-- =====================================================
-- Run these steps one at a time to safely fix RLS issues
-- Test functionality after each step

-- =====================================================
-- STEP 1: CHECK CURRENT STATUS
-- =====================================================
-- Run this first to see current state

SELECT 'Current RLS Status:' as info;
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

SELECT 'Current Policies:' as info;
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
