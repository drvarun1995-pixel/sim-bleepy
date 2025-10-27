-- Debug script to check the test event's role restrictions and user profile matching
-- This will help us understand why the test event isn't showing up for UCL Year 6

-- 1. Check the test event's allowed_roles (if the column exists)
SELECT 
    id,
    title,
    status,
    booking_enabled,
    -- Try to get allowed_roles if it exists
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'events' AND column_name = 'allowed_roles') 
        THEN 'Column exists - check manually'
        ELSE 'Column does not exist'
    END as allowed_roles_status
FROM events
WHERE title ILIKE '%test%';

-- 2. Check what columns actually exist in the events table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name LIKE '%role%' OR column_name LIKE '%allowed%'
ORDER BY column_name;

-- 3. Check if there are any other restriction columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND (column_name LIKE '%restrict%' OR column_name LIKE '%permission%' OR column_name LIKE '%access%')
ORDER BY column_name;

-- 4. Check the test event's basic info
SELECT 
    id,
    title,
    date,
    status,
    booking_enabled,
    booking_capacity,
    created_at
FROM events
WHERE title ILIKE '%test%';

-- 5. Check if the test event appears in events_with_details view
SELECT 
    id,
    title,
    date,
    status,
    booking_enabled
FROM events_with_details
WHERE title ILIKE '%test%';



