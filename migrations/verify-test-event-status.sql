-- Verify if the test event still exists after clearing allowed_roles

-- 1. Check if the test event still exists
SELECT 
    id,
    title,
    date,
    status,
    booking_enabled,
    allowed_roles
FROM events
WHERE title ILIKE '%test%';

-- 2. Check if it appears in events_with_details view
SELECT 
    id,
    title,
    date,
    status,
    booking_enabled
FROM events_with_details
WHERE title ILIKE '%test%';

-- 3. Count total events
SELECT COUNT(*) as total_events FROM events;



