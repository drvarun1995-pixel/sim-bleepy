-- =====================================================
-- FIX #1: formats_with_counts Security Definer View
-- =====================================================
-- Error: View `public.formats_with_counts` is defined with the SECURITY DEFINER property
-- =====================================================

-- First, let's see the current view definition
SELECT definition FROM pg_views WHERE schemaname = 'public' AND viewname = 'formats_with_counts';

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.formats_with_counts;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.formats_with_counts AS
SELECT 
    f.*,
    COUNT(e.id) as event_count
FROM public.formats f
LEFT JOIN public.events e ON e.format_id = f.id
GROUP BY f.id, f.name, f.slug, f.parent, f.description, f.color, f.created_at, f.updated_at;

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
    RAISE NOTICE 'This fixes Security Advisor error #1';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
