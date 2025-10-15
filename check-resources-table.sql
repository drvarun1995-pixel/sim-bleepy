-- Check resources table data and structure
-- Run this in Supabase SQL Editor

-- Check if resources table exists and its structure
SELECT 'Resources Table Structure' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resources' 
ORDER BY ordinal_position;

-- Check total count of resources
SELECT 'Resources Count' as info, COUNT(*) as total_count FROM resources;

-- Check sample resources with their teaching_date
SELECT 'Sample Resources' as info, 
  id, 
  title, 
  category, 
  teaching_date, 
  upload_date, 
  is_active,
  file_type,
  file_size
FROM resources 
ORDER BY teaching_date DESC 
LIMIT 10;

-- Check resources with recent teaching dates (last 30 days)
SELECT 'Recent Teaching Resources (Last 30 days)' as info,
  COUNT(*) as count
FROM resources 
WHERE teaching_date >= CURRENT_DATE - INTERVAL '30 days'
  AND is_active = true;

-- Check resources with teaching dates in the last 14 days (what the API looks for)
SELECT 'Resources Last 14 Days' as info,
  COUNT(*) as count
FROM resources 
WHERE teaching_date >= CURRENT_DATE - INTERVAL '14 days'
  AND teaching_date <= CURRENT_DATE
  AND is_active = true;

-- Check if there are any resources at all with teaching_date
SELECT 'Resources with Teaching Date' as info,
  COUNT(*) as count
FROM resources 
WHERE teaching_date IS NOT NULL
  AND is_active = true;

-- Check resource_events junction table
SELECT 'Resource Events Junction' as info, COUNT(*) as count FROM resource_events;

-- Check sample resource_events
SELECT 'Sample Resource Events' as info,
  re.resource_id,
  re.event_id,
  r.title as resource_title,
  e.title as event_title
FROM resource_events re
LEFT JOIN resources r ON re.resource_id = r.id
LEFT JOIN events e ON re.event_id = e.id
LIMIT 10;

-- Check events table for recent events
SELECT 'Recent Events (Last 14 days)' as info,
  COUNT(*) as count
FROM events 
WHERE date >= CURRENT_DATE - INTERVAL '14 days'
  AND date <= CURRENT_DATE;

-- Check sample recent events
SELECT 'Sample Recent Events' as info,
  id,
  title,
  date,
  start_time,
  location_name
FROM events 
WHERE date >= CURRENT_DATE - INTERVAL '14 days'
  AND date <= CURRENT_DATE
ORDER BY date DESC
LIMIT 5;
