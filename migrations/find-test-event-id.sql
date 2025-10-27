-- Find the test event with category restrictions
SELECT id, title, allowed_roles, booking_enabled
FROM events 
WHERE title ILIKE '%test%' 
   OR allowed_roles IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;



