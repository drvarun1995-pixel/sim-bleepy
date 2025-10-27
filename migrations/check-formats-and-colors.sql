-- =====================================================
-- CHECK FORMATS AND THEIR COLORS
-- =====================================================
-- This script checks what formats exist and their colors
-- =====================================================

-- Check what formats exist and their colors
SELECT 
  'All Formats' as check_type,
  id,
  name,
  color,
  slug
FROM formats
ORDER BY name;

-- Check what events have formats assigned
SELECT 
  'Events with Formats' as check_type,
  e.id,
  e.title,
  e.format_id,
  f.name as format_name,
  f.color as format_color
FROM events e
LEFT JOIN formats f ON e.format_id = f.id
WHERE e.format_id IS NOT NULL
LIMIT 10;

-- Check what events DON'T have formats
SELECT 
  'Events without Formats' as check_type,
  e.id,
  e.title,
  e.format_id
FROM events e
WHERE e.format_id IS NULL
LIMIT 10;

-- Count events by format status
SELECT 
  'Format Status Count' as check_type,
  CASE 
    WHEN format_id IS NULL THEN 'No Format'
    WHEN format_name IS NULL THEN 'Invalid Format ID'
    ELSE 'Has Format'
  END as status,
  COUNT(*) as count
FROM events_with_details
GROUP BY 
  CASE 
    WHEN format_id IS NULL THEN 'No Format'
    WHEN format_name IS NULL THEN 'Invalid Format ID'
    ELSE 'Has Format'
  END;



