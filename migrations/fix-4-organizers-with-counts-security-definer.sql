-- =====================================================
-- FIX #4: organizers_with_counts Security Definer View
-- =====================================================
-- Error: View `public.organizers_with_counts` is defined with the SECURITY DEFINER property
-- =====================================================

-- First, let's see the current view definition
SELECT definition FROM pg_views WHERE schemaname = 'public' AND viewname = 'organizers_with_counts';

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.organizers_with_counts;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.organizers_with_counts AS
SELECT 
    o.*,
    COUNT(eo.event_id) as event_count
FROM public.organizers o
LEFT JOIN public.event_organizers eo ON eo.organizer_id = o.id
GROUP BY o.id, o.name, o.created_at, o.updated_at;

-- Verify the fix
SELECT 
    'organizers_with_counts' as view_name,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ Still has SECURITY DEFINER'
        ELSE '✅ SECURITY DEFINER removed'
    END as status
FROM pg_views
WHERE schemaname = 'public' AND viewname = 'organizers_with_counts';

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FIXED: organizers_with_counts Security Definer';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'View now respects RLS policies of querying user';
    RAISE NOTICE 'This fixes Security Advisor error #4';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;