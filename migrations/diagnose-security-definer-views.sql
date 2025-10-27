-- =====================================================
-- DIAGNOSE SECURITY DEFINER VIEWS
-- =====================================================
-- Let's check what's actually happening with these views
-- =====================================================

-- Check all views and their security definer status
SELECT 
    pv.schemaname,
    pv.viewname,
    CASE 
        WHEN pv.definition LIKE '%SECURITY DEFINER%' THEN '❌ HAS SECURITY DEFINER'
        ELSE '✅ NO SECURITY DEFINER'
    END as security_definer_status,
    CASE 
        WHEN pv.definition LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type
FROM pg_views pv
WHERE pv.schemaname = 'public'
  AND pv.viewname IN (
    'formats_with_counts', 'locations_with_counts', 'speakers_with_counts',
    'organizers_with_counts', 'contact_messages_summary', 'dashboard_announcements',
    'teaching_requests_with_details', 'events_with_details', 'file_requests_with_details',
    'categories_with_counts'
  )
ORDER BY pv.viewname;

-- Check if these views even exist
SELECT 
    'View Existence Check' as check_type,
    v.viewname,
    CASE 
        WHEN pv.viewname IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    SELECT unnest(ARRAY[
        'formats_with_counts', 'locations_with_counts', 'speakers_with_counts',
        'organizers_with_counts', 'contact_messages_summary', 'dashboard_announcements',
        'teaching_requests_with_details', 'events_with_details', 'file_requests_with_details',
        'categories_with_counts'
    ]) as viewname
) v
LEFT JOIN pg_views pv ON pv.viewname = v.viewname AND pv.schemaname = 'public'
ORDER BY v.viewname;

-- Check the actual definition of one view to see what's there
SELECT 
    'Sample View Definition' as check_type,
    pv.viewname,
    LEFT(pv.definition, 200) || '...' as definition_preview
FROM pg_views pv
WHERE pv.schemaname = 'public' AND pv.viewname = 'formats_with_counts';
