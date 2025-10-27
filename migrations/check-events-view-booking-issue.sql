-- Check if the events_with_details view is properly including events with bookings
-- This will help us understand if the view itself is filtering out booking events

-- 1. Check if the test event exists in the events table
SELECT 
    id,
    title,
    date,
    status,
    booking_enabled,
    booking_capacity,
    booking_deadline_hours,
    booking_button_label,
    allowed_roles,
    approval_mode
FROM events
WHERE title ILIKE '%test%'
ORDER BY created_at DESC;

-- 2. Check if the test event exists in events_with_details view
SELECT 
    id,
    title,
    date,
    status,
    booking_enabled,
    booking_capacity,
    booking_deadline_hours,
    booking_button_label,
    allowed_roles,
    approval_mode,
    -- Check if categories are loaded
    categories
FROM events_with_details
WHERE title ILIKE '%test%'
ORDER BY created_at DESC;

-- 3. Compare counts - are we losing events in the view?
SELECT 
    'events_table' as source,
    COUNT(*) as event_count
FROM events
WHERE status = 'published'

UNION ALL

SELECT 
    'events_with_details_view' as source,
    COUNT(*) as event_count
FROM events_with_details
WHERE status = 'published';

-- 4. Check if there are any events with booking_enabled = true that are missing from the view
SELECT 
    e.id,
    e.title,
    e.booking_enabled,
    e.status,
    CASE 
        WHEN ev.id IS NULL THEN 'MISSING FROM VIEW'
        ELSE 'PRESENT IN VIEW'
    END as view_status
FROM events e
LEFT JOIN events_with_details ev ON e.id = ev.id
WHERE e.booking_enabled = true
ORDER BY e.created_at DESC
LIMIT 10;

-- 5. Check if there are any RLS policies that might be affecting the view
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'events_with_details'
ORDER BY policyname;



