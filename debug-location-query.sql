-- Debug query to check location data in events
-- Run this in your Supabase SQL Editor to see what's happening

-- Check if events_with_details view is working
SELECT 
    e.id,
    e.title,
    e.location_id,
    l.name as location_name_from_join,
    e.location_name as location_name_from_view
FROM events_with_details e
LEFT JOIN locations l ON e.location_id = l.id
LIMIT 5;

-- Check what's in the locations table
SELECT id, name FROM locations;

-- Check what's in the events table
SELECT id, title, location_id FROM events;

