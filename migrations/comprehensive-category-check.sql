-- =====================================================
-- COMPREHENSIVE CATEGORY CHECK
-- =====================================================
-- This script checks what's really happening with categories
-- =====================================================

-- Check ALL events and their category assignments
SELECT 
  'All Events with Categories' as check_type,
  e.id,
  e.title,
  e.category_id,
  c.name as category_name,
  c.color as category_color
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
ORDER BY e.title
LIMIT 20;

-- Count how many events have valid category assignments
SELECT 
  'Valid Category Assignments' as check_type,
  COUNT(*) as count
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.category_id IS NOT NULL AND c.id IS NOT NULL;

-- Count how many events have invalid category assignments
SELECT 
  'Invalid Category Assignments' as check_type,
  COUNT(*) as count
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.category_id IS NOT NULL AND c.id IS NULL;

-- Check what the categories_with_counts view actually returns
SELECT 
  'Categories with Counts View' as check_type,
  id,
  name,
  color,
  event_count
FROM categories_with_counts
ORDER BY name;

-- Check all categories in the database
SELECT 
  'All Categories in DB' as check_type,
  id,
  name,
  color
FROM categories
ORDER BY name;

-- Check if there are any events with NULL category_id
SELECT 
  'Events with NULL category_id' as check_type,
  COUNT(*) as count
FROM events
WHERE category_id IS NULL;



