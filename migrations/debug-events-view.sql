-- =====================================================
-- DEBUG EVENTS_WITH_DETAILS VIEW
-- =====================================================
-- This script checks what's wrong with the events view
-- =====================================================

-- Check what the events_with_details view returns
SELECT 
  'Events View Sample' as check_type,
  id,
  title,
  category_id,
  category_name,
  category_color,
  format_name,
  format_color
FROM events_with_details
LIMIT 10;

-- Check how many events the view returns
SELECT 
  'Events View Count' as check_type,
  COUNT(*) as count
FROM events_with_details;

-- Check events with categories in the view
SELECT 
  'Events with Categories in View' as check_type,
  COUNT(*) as count
FROM events_with_details
WHERE category_id IS NOT NULL AND category_name IS NOT NULL;

-- Check events without categories in the view
SELECT 
  'Events without Categories in View' as check_type,
  COUNT(*) as count
FROM events_with_details
WHERE category_id IS NULL OR category_name IS NULL;

-- Compare with direct events table
SELECT 
  'Direct Events Table Count' as check_type,
  COUNT(*) as count
FROM events;

-- Check direct events with categories
SELECT 
  'Direct Events with Categories' as check_type,
  COUNT(*) as count
FROM events
WHERE category_id IS NOT NULL;



