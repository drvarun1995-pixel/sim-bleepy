-- =====================================================
-- CHECK CATEGORIES_WITH_COUNTS VIEW
-- =====================================================
-- This script checks what the categories_with_counts view returns
-- =====================================================

-- Check what the categories_with_counts view returns
SELECT 
  'Categories with Counts View' as check_type,
  id,
  name,
  color,
  event_count
FROM categories_with_counts
ORDER BY name;

-- Check the definition of the view
SELECT 
  'View Definition' as check_type,
  definition
FROM pg_views
WHERE viewname = 'categories_with_counts';

-- Compare with direct categories table
SELECT 
  'Direct Categories Table' as check_type,
  id,
  name,
  color
FROM categories
ORDER BY name;



