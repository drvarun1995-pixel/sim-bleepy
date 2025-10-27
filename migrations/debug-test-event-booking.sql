-- Debug script to check if booking-related issues are affecting the test event
-- This will help us understand why the test event with bookings isn't showing up

-- 1. Check the test event and its booking settings
SELECT 
    e.id,
    e.title,
    e.date,
    e.status,
    e.booking_enabled,
    e.booking_capacity,
    e.booking_deadline_hours,
    e.booking_button_label,
    e.allowed_roles,
    e.approval_mode,
    -- Get all categories assigned to this event
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', c.id, 'name', c.name, 'color', c.color))
     FROM event_categories ec
     JOIN categories c ON ec.category_id = c.id
     WHERE ec.event_id = e.id) as assigned_categories
FROM events e
WHERE e.title ILIKE '%test%'
ORDER BY e.created_at DESC;

-- 2. Check if the test event appears in events_with_details view
SELECT 
    id,
    title,
    date,
    status,
    booking_enabled,
    booking_capacity,
    -- Check if categories are properly loaded
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', c.id, 'name', c.name, 'color', c.color))
     FROM event_categories ec
     JOIN categories c ON ec.category_id = c.id
     WHERE ec.event_id = events_with_details.id) as view_categories
FROM events_with_details
WHERE title ILIKE '%test%'
ORDER BY created_at DESC;

-- 3. Check if there are any RLS policies affecting events with bookings
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('events', 'events_with_details', 'event_bookings')
ORDER BY tablename, policyname;

-- 4. Check if there are any bookings for the test event
SELECT 
    eb.id as booking_id,
    eb.event_id,
    eb.user_id,
    eb.status as booking_status,
    eb.booked_at,
    e.title as event_title,
    e.booking_enabled
FROM event_bookings eb
JOIN events e ON eb.event_id = e.id
WHERE e.title ILIKE '%test%'
ORDER BY eb.booked_at DESC;

-- 5. Check if the test event has any restrictions that might affect filtering
SELECT 
    e.id,
    e.title,
    e.allowed_roles,
    e.approval_mode,
    e.booking_enabled,
    e.booking_capacity,
    -- Check if there are any category restrictions
    CASE 
        WHEN e.allowed_roles IS NOT NULL THEN 'Has role restrictions'
        ELSE 'No role restrictions'
    END as restriction_status
FROM events e
WHERE e.title ILIKE '%test%';



