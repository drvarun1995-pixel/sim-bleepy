-- =====================================================
-- CHECK EVENTS THAT HAVE CATEGORIES ASSIGNED
-- =====================================================
-- This script checks events that actually have categories
-- =====================================================

-- Check events that have valid category assignments
SELECT 
  'Events with Valid Categories' as check_type,
  e.id,
  e.title,
  e.category_id,
  c.name as category_name,
  c.color as category_color
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.category_id IS NOT NULL AND c.id IS NOT NULL
ORDER BY e.title
LIMIT 20;

-- Count events with valid categories
SELECT 
  'Count of Events with Valid Categories' as check_type,
  COUNT(*) as count
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.category_id IS NOT NULL AND c.id IS NOT NULL;

-- Check what categories are actually being used
SELECT 
  'Categories in Use' as check_type,
  c.id,
  c.name,
  c.color,
  COUNT(e.id) as event_count
FROM categories c
LEFT JOIN events e ON c.id = e.category_id
WHERE e.id IS NOT NULL
GROUP BY c.id, c.name, c.color
ORDER BY event_count DESC;

-- Check if there are events with invalid category IDs
SELECT 
  'Events with Invalid Category IDs' as check_type,
  e.id,
  e.title,
  e.category_id
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.category_id IS NOT NULL AND c.id IS NULL
LIMIT 10;



