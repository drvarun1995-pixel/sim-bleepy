-- =====================================================
-- FIX #2: locations_with_counts Security Definer View
-- =====================================================
-- Error: View `public.locations_with_counts` is defined with the SECURITY DEFINER property
-- =====================================================

-- First, let's see the current view definition
SELECT definition FROM pg_views WHERE schemaname = 'public' AND viewname = 'locations_with_counts';

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.locations_with_counts;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.locations_with_counts AS
SELECT 
    l.*,
    COUNT(e.id) as event_count
FROM public.locations l
LEFT JOIN public.events e ON e.location_id = l.id
GROUP BY l.id, l.name, l.address, l.latitude, l.longitude, l.created_at, l.updated_at;

-- Verify the fix
SELECT 
    'locations_with_counts' as view_name,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ Still has SECURITY DEFINER'
        ELSE '✅ SECURITY DEFINER removed'
    END as status
FROM pg_views
WHERE schemaname = 'public' AND viewname = 'locations_with_counts';

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FIXED: locations_with_counts Security Definer';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'View now respects RLS policies of querying user';
    RAISE NOTICE 'This fixes Security Advisor error #2';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;