-- Check what events were deleted and help restore them

-- 1. Check if there are any events with 'test' in the title currently
SELECT 
    id,
    title,
    date,
    status,
    created_at
FROM events
WHERE title ILIKE '%test%'
ORDER BY created_at DESC;

-- 2. Check recent events to see what's missing
SELECT 
    id,
    title,
    date,
    status,
    created_at
FROM events
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check if we can find the deleted events in any backup or audit log
-- (This might not work depending on your setup)
SELECT 
    id,
    title,
    date,
    status,
    created_at
FROM events
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 4. Check if there are any events that were created around the same time as the test event
-- Look for events created in the last few days
SELECT 
    id,
    title,
    date,
    status,
    created_at,
    updated_at
FROM events
WHERE created_at >= NOW() - INTERVAL '3 days'
ORDER BY created_at DESC;



