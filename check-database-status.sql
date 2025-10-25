-- Check database status and data counts
-- Run this in your Supabase SQL Editor

-- 1. Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check events count
SELECT COUNT(*) as total_events FROM events;

-- 3. Check categories count
SELECT COUNT(*) as total_categories FROM categories;

-- 4. Check formats count  
SELECT COUNT(*) as total_formats FROM formats;

-- 5. Check speakers count
SELECT COUNT(*) as total_speakers FROM speakers;

-- 6. Check locations count
SELECT COUNT(*) as total_locations FROM locations;

-- 7. Check organizers count
SELECT COUNT(*) as total_organizers FROM organizers;

-- 8. Check users count
SELECT COUNT(*) as total_users FROM users;

-- 9. Check if views exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'VIEW'
ORDER BY table_name;

-- 10. Sample events data (if any exist)
SELECT 
    id,
    title,
    date,
    status
FROM events 
LIMIT 5;


