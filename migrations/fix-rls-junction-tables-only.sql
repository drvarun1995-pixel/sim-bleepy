-- =====================================================
-- FIX RLS ON JUNCTION TABLES ONLY
-- =====================================================
-- This ONLY enables RLS on two tables - no other changes
-- =====================================================

-- Check current RLS status
SELECT 
    'Current RLS Status' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('event_categories', 'event_speakers')
ORDER BY tablename;

-- Enable RLS on event_categories (if not already enabled)
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on event_speakers (if not already enabled)  
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

-- Verify RLS is now enabled
SELECT 
    'After Fix RLS Status' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('event_categories', 'event_speakers')
ORDER BY tablename;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ENABLED RLS ON JUNCTION TABLES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ event_categories - RLS enabled';
    RAISE NOTICE '✓ event_speakers - RLS enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'This should fix the remaining 2 Security Advisor errors';
    RAISE NOTICE 'No database structure changes made';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;



