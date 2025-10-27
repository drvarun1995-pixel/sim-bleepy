-- =====================================================
-- CHECK ALL CATEGORIES IN THE SYSTEM
-- =====================================================
-- This script checks what categories exist vs what's assigned to events
-- =====================================================

-- Check all categories in the database
SELECT 
  'All Categories in DB' as check_type,
  id,
  name,
  color,
  slug,
  created_at
FROM categories
ORDER BY name;

-- Check which categories are actually assigned to events
SELECT 
  'Categories Assigned to Events' as check_type,
  c.id,
  c.name,
  c.color,
  COUNT(e.id) as event_count
FROM categories c
LEFT JOIN events e ON c.id = e.category_id
GROUP BY c.id, c.name, c.color
ORDER BY event_count DESC, c.name;

-- Check which categories are NOT assigned to any events
SELECT 
  'Unused Categories' as check_type,
  c.id,
  c.name,
  c.color
FROM categories c
LEFT JOIN events e ON c.id = e.category_id
WHERE e.id IS NULL
ORDER BY c.name;

-- Count total categories vs assigned categories
SELECT 
  'Category Summary' as check_type,
  (SELECT COUNT(*) FROM categories) as total_categories,
  (SELECT COUNT(DISTINCT category_id) FROM events WHERE category_id IS NOT NULL) as categories_in_use,
  (SELECT COUNT(*) FROM categories c LEFT JOIN events e ON c.id = e.category_id WHERE e.id IS NULL) as unused_categories;



