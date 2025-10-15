-- ============================================================================
-- FIX SECURITY DEFINER VIEWS
-- ============================================================================
-- This migration fixes 3 views that were using SECURITY DEFINER
-- 
-- ISSUE: Views with SECURITY DEFINER enforce the view creator's permissions
-- instead of the querying user's permissions. This is a security risk.
--
-- SOLUTION: Recreate views with security_invoker = true
-- This makes views use the querying user's (service role's) permissions
--
-- VIEWS FIXED:
-- 1. events_with_details
-- 2. categories_with_counts
-- 3. formats_with_counts
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing SECURITY DEFINER Views';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 1. EVENTS WITH DETAILS VIEW
-- ============================================================================
-- Comprehensive view joining events with all related data

DROP VIEW IF EXISTS public.events_with_details CASCADE;

CREATE VIEW public.events_with_details
WITH (security_invoker = true) AS
SELECT 
    e.*,
    c.name as category_name,
    c.color as category_color,
    f.name as format_name,
    f.color as format_color,
    l.name as location_name,
    o.name as organizer_name,
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'role', s.role
            )
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'::json
    ) as speakers
FROM public.events e
LEFT JOIN public.categories c ON e.category_id = c.id
LEFT JOIN public.formats f ON e.format_id = f.id
LEFT JOIN public.locations l ON e.location_id = l.id
LEFT JOIN public.organizers o ON e.organizer_id = o.id
LEFT JOIN public.event_speakers es ON e.id = es.event_id
LEFT JOIN public.speakers s ON es.speaker_id = s.id
GROUP BY e.id, c.name, c.color, f.name, f.color, l.name, o.name;

DO $$
BEGIN
  RAISE NOTICE '✅ events_with_details: Recreated with security_invoker = true';
END $$;

-- ============================================================================
-- 2. CATEGORIES WITH COUNTS VIEW
-- ============================================================================
-- Shows categories with count of published events

DROP VIEW IF EXISTS public.categories_with_counts CASCADE;

CREATE VIEW public.categories_with_counts
WITH (security_invoker = true) AS
SELECT 
    c.*,
    COUNT(e.id) as event_count
FROM public.categories c
LEFT JOIN public.events e ON c.id = e.category_id AND e.status = 'published'
GROUP BY c.id;

DO $$
BEGIN
  RAISE NOTICE '✅ categories_with_counts: Recreated with security_invoker = true';
END $$;

-- ============================================================================
-- 3. FORMATS WITH COUNTS VIEW
-- ============================================================================
-- Shows formats with count of published events

DROP VIEW IF EXISTS public.formats_with_counts CASCADE;

CREATE VIEW public.formats_with_counts
WITH (security_invoker = true) AS
SELECT 
    f.*,
    COUNT(e.id) as event_count
FROM public.formats f
LEFT JOIN public.events e ON f.id = e.format_id AND e.status = 'published'
GROUP BY f.id;

DO $$
BEGIN
  RAISE NOTICE '✅ formats_with_counts: Recreated with security_invoker = true';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  view_count INTEGER;
BEGIN
  -- Count views that exist
  SELECT COUNT(*) INTO view_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND viewname IN ('events_with_details', 'categories_with_counts', 'formats_with_counts');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECURITY DEFINER Views Fix Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Views recreated: %', view_count;
  RAISE NOTICE 'Expected: 3 views';
  RAISE NOTICE '';
  
  IF view_count = 3 THEN
    RAISE NOTICE '✅ SUCCESS: All views recreated with security_invoker';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Some views may be missing';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'All views now use security_invoker = true';
  RAISE NOTICE 'This means they use the querying user''s permissions';
  RAISE NOTICE 'For your app, this is the service role''s permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Check Supabase Security Advisor (should show 0 errors)';
  RAISE NOTICE '2. Test views return correct data';
  RAISE NOTICE '3. Follow TESTING_CHECKLIST.md';
  RAISE NOTICE '========================================';
END $$;

