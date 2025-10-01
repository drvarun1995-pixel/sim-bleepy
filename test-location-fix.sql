-- Test query to verify the location fix
-- Run this in your Supabase SQL Editor

-- Check if the events_with_details view now properly shows location names
SELECT 
    id,
    title,
    location_id,
    location_name
FROM events_with_details
LIMIT 5;

-- Also check what's in the locations table to see if the location exists
SELECT id, name FROM locations WHERE id = '15a7f091-7a88-4529-81ea-4db0a3584d82';

