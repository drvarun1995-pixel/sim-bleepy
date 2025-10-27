-- =====================================================
-- CHECK CATEGORIES AND COLORS IN EVENTS VIEW
-- =====================================================
-- This script checks what's wrong with categories and colors
-- =====================================================

-- Check what categories exist in the database
SELECT 
  'Categories in DB' as check_type,
  id,
  name,
  color,
  slug
FROM categories
ORDER BY name;

-- Check what columns exist in the events view
SELECT 
  'Events View Columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'events_with_details'
ORDER BY ordinal_position;

-- Check what the events view is returning for categories
SELECT 
  'Events View Sample' as check_type,
  id,
  title,
  category_id
FROM events_with_details
WHERE category_id IS NOT NULL
LIMIT 10;

-- Check if there are events with missing category data
SELECT 
  'Missing Category Data' as check_type,
  COUNT(*) as count
FROM events_with_details
WHERE category_id IS NOT NULL;

-- Check a specific event to see what's happening
SELECT 
  'Sample Event Details' as check_type,
  e.id,
  e.title,
  e.category_id,
  c.name as category_name_from_join,
  c.color as category_color_from_join
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.id = (SELECT id FROM events LIMIT 1);
