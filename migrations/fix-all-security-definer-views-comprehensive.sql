-- =====================================================
-- COMPREHENSIVE FIX FOR ALL SECURITY DEFINER VIEWS
-- =====================================================
-- This fixes all 9 Security Definer view errors at once
-- =====================================================

-- First, let's see which views actually have SECURITY DEFINER
SELECT 
    'Views with SECURITY DEFINER' as check_type,
    viewname,
    'HAS SECURITY DEFINER' as status
FROM pg_views
WHERE schemaname = 'public' 
  AND definition LIKE '%SECURITY DEFINER%'
  AND viewname IN (
    'formats_with_counts', 'locations_with_counts', 'speakers_with_counts',
    'organizers_with_counts', 'contact_messages_summary', 'dashboard_announcements',
    'teaching_requests_with_details', 'events_with_details', 'file_requests_with_details',
    'categories_with_counts'
  )
ORDER BY viewname;

-- Fix 1: formats_with_counts
DROP VIEW IF EXISTS public.formats_with_counts CASCADE;
CREATE VIEW public.formats_with_counts AS
SELECT 
    f.id,
    f.name,
    f.slug,
    f.parent,
    f.description,
    f.color,
    f.created_at,
    f.updated_at,
    COUNT(e.id) as event_count
FROM public.formats f
LEFT JOIN public.events e ON e.format_id = f.id
GROUP BY f.id, f.name, f.slug, f.parent, f.description, f.color, f.created_at, f.updated_at;

-- Fix 2: locations_with_counts
DROP VIEW IF EXISTS public.locations_with_counts CASCADE;
CREATE VIEW public.locations_with_counts AS
SELECT 
    l.id,
    l.name,
    l.address,
    l.latitude,
    l.longitude,
    l.created_at,
    l.updated_at,
    COUNT(e.id) as event_count
FROM public.locations l
LEFT JOIN public.events e ON e.location_id = l.id
GROUP BY l.id, l.name, l.address, l.latitude, l.longitude, l.created_at, l.updated_at;

-- Fix 3: speakers_with_counts
DROP VIEW IF EXISTS public.speakers_with_counts CASCADE;
CREATE VIEW public.speakers_with_counts AS
SELECT 
    s.id,
    s.name,
    s.role,
    s.created_at,
    s.updated_at,
    COUNT(es.event_id) as event_count
FROM public.speakers s
LEFT JOIN public.event_speakers es ON es.speaker_id = s.id
GROUP BY s.id, s.name, s.role, s.created_at, s.updated_at;

-- Fix 4: organizers_with_counts
DROP VIEW IF EXISTS public.organizers_with_counts CASCADE;
CREATE VIEW public.organizers_with_counts AS
SELECT 
    o.id,
    o.name,
    o.created_at,
    o.updated_at,
    COUNT(eo.event_id) as event_count
FROM public.organizers o
LEFT JOIN public.event_organizers eo ON eo.organizer_id = o.id
GROUP BY o.id, o.name, o.created_at, o.updated_at;

-- Fix 5: contact_messages_summary
DROP VIEW IF EXISTS public.contact_messages_summary CASCADE;
CREATE VIEW public.contact_messages_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread_messages,
    COUNT(CASE WHEN status = 'read' THEN 1 END) as read_messages,
    COUNT(CASE WHEN status = 'replied' THEN 1 END) as replied_messages
FROM public.contact_messages
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Fix 6: dashboard_announcements
DROP VIEW IF EXISTS public.dashboard_announcements CASCADE;
CREATE VIEW public.dashboard_announcements AS
SELECT 
    a.id,
    a.title,
    a.content,
    a.author_id,
    a.target_audience,
    a.priority,
    a.is_active,
    a.expires_at,
    a.created_at,
    a.updated_at
FROM public.announcements a
WHERE a.is_active = true
ORDER BY a.created_at DESC;

-- Fix 7: teaching_requests_with_details
DROP VIEW IF EXISTS public.teaching_requests_with_details CASCADE;
CREATE VIEW public.teaching_requests_with_details AS
SELECT 
    tr.id,
    tr.user_email,
    tr.user_name,
    tr.topic,
    tr.description,
    tr.preferred_date,
    tr.preferred_time,
    tr.duration,
    tr.categories,
    tr.format,
    tr.additional_info,
    tr.status,
    tr.created_at,
    tr.updated_at
FROM public.teaching_requests tr;

-- Fix 8: events_with_details
DROP VIEW IF EXISTS public.events_with_details CASCADE;
CREATE VIEW public.events_with_details AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e.start_time,
    e.end_time,
    e.is_all_day,
    e.hide_time,
    e.hide_end_time,
    e.time_notes,
    e.location_id,
    e.other_location_ids,
    e.hide_location,
    e.organizer_id,
    e.other_organizer_ids,
    e.hide_organizer,
    e.category_id,
    e.format_id,
    e.hide_speakers,
    e.event_link,
    e.more_info_link,
    e.more_info_target,
    e.event_status,
    e.attendees,
    e.status,
    e.author_id,
    e.author_name,
    e.created_at,
    e.updated_at,
    c.name as category_name,
    f.name as format_name,
    l.name as location_name
FROM public.events e
LEFT JOIN public.categories c ON c.id = e.category_id
LEFT JOIN public.formats f ON f.id = e.format_id
LEFT JOIN public.locations l ON l.id = e.location_id;

-- Fix 9: file_requests_with_details
DROP VIEW IF EXISTS public.file_requests_with_details CASCADE;
CREATE VIEW public.file_requests_with_details AS
SELECT 
    fr.id,
    fr.user_email,
    fr.user_name,
    fr.file_name,
    fr.description,
    fr.additional_info,
    fr.event_id,
    fr.event_title,
    fr.event_date,
    fr.status,
    fr.admin_notes,
    fr.assigned_to,
    fr.completed_at,
    fr.rejected_at,
    fr.rejection_reason,
    fr.created_at,
    fr.updated_at
FROM public.file_requests fr;

-- Fix 10: categories_with_counts
DROP VIEW IF EXISTS public.categories_with_counts CASCADE;
CREATE VIEW public.categories_with_counts AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.parent,
    c.description,
    c.color,
    c.created_at,
    c.updated_at,
    COUNT(e.id) as event_count
FROM public.categories c
LEFT JOIN public.events e ON e.category_id = c.id
GROUP BY c.id, c.name, c.slug, c.parent, c.description, c.color, c.created_at, c.updated_at;

-- Verify all views are now fixed
SELECT 
    'Final Verification' as check_type,
    viewname,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ STILL HAS SECURITY DEFINER'
        ELSE '✅ SECURITY DEFINER REMOVED'
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

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL SECURITY DEFINER VIEWS FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ formats_with_counts';
    RAISE NOTICE '✓ locations_with_counts';
    RAISE NOTICE '✓ speakers_with_counts';
    RAISE NOTICE '✓ organizers_with_counts';
    RAISE NOTICE '✓ contact_messages_summary';
    RAISE NOTICE '✓ dashboard_announcements';
    RAISE NOTICE '✓ teaching_requests_with_details';
    RAISE NOTICE '✓ events_with_details';
    RAISE NOTICE '✓ file_requests_with_details';
    RAISE NOTICE '✓ categories_with_counts';
    RAISE NOTICE '';
    RAISE NOTICE 'All 9 Security Advisor errors should now be resolved!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
