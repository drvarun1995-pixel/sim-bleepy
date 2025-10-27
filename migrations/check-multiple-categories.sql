-- =====================================================
-- CHECK FOR MULTIPLE CATEGORIES PER EVENT
-- =====================================================
-- This script checks if events have multiple categories
-- =====================================================

-- Check if there's a junction table for event categories
SELECT 
  'Event Categories Junction Table' as check_type,
  table_name
FROM information_schema.tables
WHERE table_name LIKE '%event%category%' 
   OR table_name LIKE '%category%event%';

-- Check if events table has other category fields
SELECT 
  'Events Table Columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'events' 
  AND column_name LIKE '%category%'
ORDER BY ordinal_position;

-- Check if there are any array columns in events
SELECT 
  'Array Columns in Events' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'events' 
  AND data_type LIKE '%array%'
ORDER BY ordinal_position;



