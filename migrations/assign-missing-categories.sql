-- =====================================================
-- ASSIGN MISSING CATEGORIES TO EVENTS
-- =====================================================
-- This script assigns categories to events that don't have them
-- =====================================================

-- First, let's see what categories exist
SELECT 
  'Available Categories' as check_type,
  id,
  name,
  color
FROM categories
ORDER BY name;

-- Check events without categories
SELECT 
  'Events without Categories' as check_type,
  id,
  title,
  date,
  format_id
FROM events
WHERE category_id IS NULL
ORDER BY date
LIMIT 10;

-- Assign categories based on event titles/descriptions
-- This is a basic assignment - you may want to review and adjust
UPDATE events 
SET category_id = (
  CASE 
    -- UCL events
    WHEN title ILIKE '%UCL%' OR title ILIKE '%ucl%' THEN 
      (SELECT id FROM categories WHERE name = 'UCL Year 6' LIMIT 1)
    
    -- ARU events
    WHEN title ILIKE '%ARU%' OR title ILIKE '%aru%' THEN 
      (SELECT id FROM categories WHERE name = 'ARU Year 4' LIMIT 1)
    
    -- Foundation events
    WHEN title ILIKE '%foundation%' OR title ILIKE '%Foundation%' THEN 
      (SELECT id FROM categories WHERE name = 'Foundation Year Doctor' LIMIT 1)
    
    -- Default to UCL Year 6 for everything else
    ELSE (SELECT id FROM categories WHERE name = 'UCL Year 6' LIMIT 1)
  END
)
WHERE category_id IS NULL;

-- Check the results
SELECT 
  'After Assignment' as check_type,
  COUNT(*) as events_with_categories
FROM events
WHERE category_id IS NOT NULL;

-- Check events still without categories
SELECT 
  'Still Missing Categories' as check_type,
  COUNT(*) as count
FROM events
WHERE category_id IS NULL;



