-- =====================================================
-- CHECK ALL SECURITY DEFINER VIEWS IN DATABASE
-- =====================================================
-- Let's find ALL views that have SECURITY DEFINER
-- =====================================================

-- Find all views with SECURITY DEFINER
SELECT 
    'Security Definer Views Found' as check_type,
    schemaname,
    viewname,
    'HAS SECURITY DEFINER' as status
FROM pg_views
WHERE definition LIKE '%SECURITY DEFINER%'
ORDER BY schemaname, viewname;

-- Count total views with SECURITY DEFINER
SELECT 
    'Total Security Definer Views' as check_type,
    COUNT(*) as count
FROM pg_views
WHERE definition LIKE '%SECURITY DEFINER%';

-- Check if any of the specific views from Security Advisor exist
SELECT 
    'Security Advisor Views Check' as check_type,
    viewname,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ HAS SECURITY DEFINER'
        ELSE '✅ NO SECURITY DEFINER'
    END as status
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'formats_with_counts', 'locations_with_counts', 'speakers_with_counts',
    'organizers_with_counts', 'contact_messages_summary', 'dashboard_announcements',
    'teaching_requests_with_details', 'events_with_details', 'file_requests_with_details',
    'categories_with_counts'
  )
ORDER BY viewname;



