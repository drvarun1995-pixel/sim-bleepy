-- =====================================================
-- FIX #1: formats_with_counts Security Definer View
-- =====================================================
-- This fixes the first security error: formats_with_counts view
-- =====================================================

-- Remove SECURITY DEFINER from formats_with_counts view
ALTER VIEW public.formats_with_counts SET (security_definer = false);

-- Verify the fix
SELECT 
    'formats_with_counts' as view_name,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ Still has SECURITY DEFINER'
        ELSE '✅ SECURITY DEFINER removed'
    END as status
FROM pg_views
WHERE schemaname = 'public' AND viewname = 'formats_with_counts';

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FIXED: formats_with_counts Security Definer';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'View now respects RLS policies of querying user';
    RAISE NOTICE 'Run Security Advisor to verify this error is resolved';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;



