-- =====================================================
-- CHECK EVENTS_WITH_DETAILS VIEW
-- =====================================================
-- This script checks if the events_with_details view is working
-- =====================================================

-- Check if the view exists
SELECT 
  'View Exists' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'events_with_details') 
    THEN '✅ EXISTS' 
    ELSE '❌ DOES NOT EXIST' 
  END as status;

-- Try to query the view
SELECT 
  'View Query Test' as check_type,
  COUNT(*) as event_count
FROM events_with_details;

-- Check what columns the view has
SELECT 
  'View Columns' as check_type,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'events_with_details'
ORDER BY ordinal_position;

-- Try to get a sample event
SELECT 
  'Sample Event' as check_type,
  id,
  title,
  date,
  status
FROM events_with_details 
LIMIT 1;



