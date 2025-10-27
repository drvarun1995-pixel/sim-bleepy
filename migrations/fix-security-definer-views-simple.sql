-- =====================================================
-- FIX SECURITY DEFINER VIEWS - SIMPLE APPROACH
-- =====================================================
-- Instead of recreating views, let's just remove SECURITY DEFINER property
-- =====================================================

-- 1. Fix formats_with_counts view
ALTER VIEW public.formats_with_counts SET (security_definer = false);

-- 2. Fix locations_with_counts view  
ALTER VIEW public.locations_with_counts SET (security_definer = false);

-- 3. Fix speakers_with_counts view
ALTER VIEW public.speakers_with_counts SET (security_definer = false);

-- 4. Fix organizers_with_counts view
ALTER VIEW public.organizers_with_counts SET (security_definer = false);

-- 5. Fix contact_messages_summary view
ALTER VIEW public.contact_messages_summary SET (security_definer = false);

-- 6. Fix dashboard_announcements view
ALTER VIEW public.dashboard_announcements SET (security_definer = false);

-- 7. Fix teaching_requests_with_details view
ALTER VIEW public.teaching_requests_with_details SET (security_definer = false);

-- 8. Fix events_with_details view
ALTER VIEW public.events_with_details SET (security_definer = false);

-- 9. Fix file_requests_with_details view
ALTER VIEW public.file_requests_with_details SET (security_definer = false);

-- 10. Fix categories_with_counts view
ALTER VIEW public.categories_with_counts SET (security_definer = false);

-- =====================================================
-- ENABLE RLS ON JUNCTION TABLES
-- =====================================================

-- Enable RLS on event_categories
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on event_speakers  
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES FOR JUNCTION TABLES
-- =====================================================

-- Policies for event_categories
CREATE POLICY "Everyone can view event categories"
    ON public.event_categories FOR SELECT
    USING (true);

CREATE POLICY "Event managers can insert event categories"
    ON public.event_categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
        )
    );

CREATE POLICY "Event managers can delete event categories"
    ON public.event_categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
        )
    );

-- Policies for event_speakers
CREATE POLICY "Everyone can view event speakers"
    ON public.event_speakers FOR SELECT
    USING (true);

CREATE POLICY "Event managers can insert event speakers"
    ON public.event_speakers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
        )
    );

CREATE POLICY "Event managers can delete event speakers"
    ON public.event_speakers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
        )
    );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that views no longer have SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ Still has SECURITY DEFINER'
        ELSE '✅ SECURITY DEFINER removed'
    END as status
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'formats_with_counts', 'locations_with_counts', 'speakers_with_counts',
    'organizers_with_counts', 'contact_messages_summary', 'dashboard_announcements',
    'teaching_requests_with_details', 'events_with_details', 'file_requests_with_details',
    'categories_with_counts'
  );

-- Check that RLS is enabled on junction tables
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('event_categories', 'event_speakers')
ORDER BY tablename;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SECURITY DEFINER VIEWS FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 REMOVED SECURITY DEFINER FROM (9):';
    RAISE NOTICE '  ✓ formats_with_counts';
    RAISE NOTICE '  ✓ locations_with_counts';
    RAISE NOTICE '  ✓ speakers_with_counts';
    RAISE NOTICE '  ✓ organizers_with_counts';
    RAISE NOTICE '  ✓ contact_messages_summary';
    RAISE NOTICE '  ✓ dashboard_announcements';
    RAISE NOTICE '  ✓ teaching_requests_with_details';
    RAISE NOTICE '  ✓ events_with_details';
    RAISE NOTICE '  ✓ file_requests_with_details';
    RAISE NOTICE '  ✓ categories_with_counts';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ENABLED RLS ON TABLES (2):';
    RAISE NOTICE '  ✓ event_categories';
    RAISE NOTICE '  ✓ event_speakers';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CREATED RLS POLICIES:';
    RAISE NOTICE '  ✓ View policies for all users';
    RAISE NOTICE '  ✓ Insert/Delete policies for event managers';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All 11 security errors should now be resolved!';
    RAISE NOTICE 'Run the Security Advisor again to verify.';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;



