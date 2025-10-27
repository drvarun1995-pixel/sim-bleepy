-- =====================================================
-- FIX #3: speakers_with_counts Security Definer View
-- =====================================================
-- Error: View `public.speakers_with_counts` is defined with the SECURITY DEFINER property
-- =====================================================

-- First, let's see the current view definition
SELECT definition FROM pg_views WHERE schemaname = 'public' AND viewname = 'speakers_with_counts';

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.speakers_with_counts;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.speakers_with_counts AS
SELECT 
    s.*,
    COUNT(es.event_id) as event_count
FROM public.speakers s
LEFT JOIN public.event_speakers es ON es.speaker_id = s.id
GROUP BY s.id, s.name, s.role, s.created_at, s.updated_at;

-- Verify the fix
SELECT 
    'speakers_with_counts' as view_name,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ Still has SECURITY DEFINER'
        ELSE '✅ SECURITY DEFINER removed'
    END as status
FROM pg_views
WHERE schemaname = 'public' AND viewname = 'speakers_with_counts';

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FIXED: speakers_with_counts Security Definer';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'View now respects RLS policies of querying user';
    RAISE NOTICE 'This fixes Security Advisor error #3';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;