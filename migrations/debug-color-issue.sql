-- =====================================================
-- DEBUG COLOR CODING ISSUE
-- =====================================================
-- This script checks what's wrong with the color coding
-- =====================================================

-- Check what categories exist and their colors
SELECT 
  'All Categories' as check_type,
  id,
  name,
  color,
  slug
FROM categories
ORDER BY name;

-- Check what events have categories assigned
SELECT 
  'Events with Categories' as check_type,
  e.id,
  e.title,
  e.category_id,
  c.name as category_name,
  c.color as category_color
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.category_id IS NOT NULL
LIMIT 10;

-- Check what events DON'T have categories
SELECT 
  'Events without Categories' as check_type,
  e.id,
  e.title,
  e.category_id
FROM events e
WHERE e.category_id IS NULL
LIMIT 10;

-- Check the events_with_details view output
SELECT 
  'View Output Sample' as check_type,
  id,
  title,
  category_id,
  category_name,
  category_color
FROM events_with_details
LIMIT 10;

-- Count events by category status
SELECT 
  'Category Status Count' as check_type,
  CASE 
    WHEN category_id IS NULL THEN 'No Category'
    WHEN category_name IS NULL THEN 'Invalid Category ID'
    ELSE 'Has Category'
  END as status,
  COUNT(*) as count
FROM events_with_details
GROUP BY 
  CASE 
    WHEN category_id IS NULL THEN 'No Category'
    WHEN category_name IS NULL THEN 'Invalid Category ID'
    ELSE 'Has Category'
  END;



