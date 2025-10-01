-- Check and fix locations table
-- Run this in your Supabase SQL Editor

-- 1. Check what's in the locations table
SELECT 'Current locations:' as info;
SELECT id, name FROM locations ORDER BY created_at;

-- 2. Check if the specific location ID exists
SELECT 'Location ID check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM locations WHERE id = '15a7f091-7a88-4529-81ea-4db0a3584d82') 
        THEN 'Location exists' 
        ELSE 'Location does NOT exist' 
    END as status;

-- 3. If the location doesn't exist, we need to either:
--    a) Create a location with that ID, or
--    b) Update the event to use a different location_id

-- Option A: Create a location with the existing ID (if you know what it should be)
-- INSERT INTO locations (id, name) VALUES ('15a7f091-7a88-4529-81ea-4db0a3584d82', 'Your Location Name Here');

-- Option B: Update the event to use a different location (safer option)
-- First, let's see what locations exist:
SELECT 'Available locations:' as info;
SELECT id, name FROM locations;

-- If you have locations, you can update the event like this:
-- UPDATE events SET location_id = (SELECT id FROM locations LIMIT 1) WHERE id = 'e30a0bc6-40c4-4a19-a4ee-7ba1f5d022e8';

