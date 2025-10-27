-- =====================================================
-- DEBUG CATEGORY ASSIGNMENTS
-- =====================================================
-- This script checks what's wrong with category assignments
-- =====================================================

-- Check all events and their category assignments
SELECT 
  'Events with Category IDs' as check_type,
  e.id,
  e.title,
  e.category_id,
  c.name as category_name,
  c.color as category_color
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
ORDER BY e.category_id
LIMIT 20;

-- Check for events with invalid category IDs
SELECT 
  'Events with Invalid Category IDs' as check_type,
  e.id,
  e.title,
  e.category_id
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.category_id IS NOT NULL AND c.id IS NULL
LIMIT 10;

-- Check for events with NULL category_id
SELECT 
  'Events with NULL Category ID' as check_type,
  COUNT(*) as count
FROM events
WHERE category_id IS NULL;

-- Check what category IDs are actually being used in events
SELECT 
  'Category IDs in Events' as check_type,
  category_id,
  COUNT(*) as event_count
FROM events
WHERE category_id IS NOT NULL
GROUP BY category_id
ORDER BY event_count DESC;

-- Check if there are any events with category_id but no matching category
SELECT 
  'Orphaned Category References' as check_type,
  e.category_id,
  COUNT(*) as event_count
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.category_id IS NOT NULL AND c.id IS NULL
GROUP BY e.category_id;



