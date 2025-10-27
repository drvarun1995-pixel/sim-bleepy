-- Check the test event's allowed_roles and fix the filtering issue

-- 1. Check the test event's allowed_roles
SELECT 
    id,
    title,
    status,
    booking_enabled,
    allowed_roles
FROM events
WHERE title ILIKE '%test%';

-- 2. Check what roles are in the allowed_roles array
SELECT 
    id,
    title,
    allowed_roles,
    -- Extract individual roles from the array
    unnest(allowed_roles) as individual_role
FROM events
WHERE title ILIKE '%test%';

-- 3. Clear the allowed_roles to make the event visible to all users
UPDATE events 
SET allowed_roles = NULL
WHERE title ILIKE '%test%';

-- 4. Verify the update
SELECT 
    id,
    title,
    status,
    booking_enabled,
    allowed_roles
FROM events
WHERE title ILIKE '%test%';



