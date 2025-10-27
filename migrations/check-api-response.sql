-- =====================================================
-- CHECK WHAT THE API IS ACTUALLY RETURNING
-- =====================================================
-- This script checks what the categories API returns
-- =====================================================

-- Check what categories_with_counts returns
SELECT 
  'Categories with Counts' as check_type,
  id,
  name,
  color,
  event_count
FROM categories_with_counts
ORDER BY name;

-- Check what the direct categories table returns
SELECT 
  'Direct Categories' as check_type,
  id,
  name,
  color
FROM categories
ORDER BY name;

-- Check if there's a difference
SELECT 
  'Missing Categories' as check_type,
  c.id,
  c.name,
  c.color
FROM categories c
LEFT JOIN categories_with_counts cc ON c.id = cc.id
WHERE cc.id IS NULL
ORDER BY c.name;



