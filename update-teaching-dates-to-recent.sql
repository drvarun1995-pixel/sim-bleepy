-- Update existing resources to have recent teaching dates
-- Run this in your PRODUCTION Supabase SQL Editor
-- This will make existing resources appear in the "Recent Teaching Files" section

-- First, check what resources exist
SELECT 'Current Resources' as info, 
  id, 
  title, 
  teaching_date,
  is_active
FROM resources 
ORDER BY upload_date DESC 
LIMIT 20;

-- Update the teaching_date of active resources to be within the last 14 days
-- This distributes them across the last 2 weeks
UPDATE resources
SET teaching_date = CURRENT_DATE - (ROW_NUMBER() OVER (ORDER BY upload_date DESC) % 14)
WHERE is_active = true;

-- Verify the update
SELECT 'Updated Resources (Last 14 Days)' as info,
  id,
  title,
  teaching_date,
  CURRENT_DATE - teaching_date as days_ago
FROM resources 
WHERE teaching_date >= CURRENT_DATE - INTERVAL '14 days'
  AND is_active = true
ORDER BY teaching_date DESC;

-- Check count
SELECT 'Total Recent Resources' as info, 
  COUNT(*) as count 
FROM resources 
WHERE teaching_date >= CURRENT_DATE - INTERVAL '14 days'
  AND is_active = true;
