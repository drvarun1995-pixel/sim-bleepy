-- =====================================================
-- CHECK EVENTS VIEW AFTER FIX
-- =====================================================
-- This script checks what happened to the events view
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

-- Check if there are any errors by trying to get a sample
SELECT 
  'Sample Query' as check_type,
  id,
  title,
  date
FROM events_with_details 
LIMIT 1;

-- Check what columns the view has now
SELECT 
  'View Columns' as check_type,
  column_name
FROM information_schema.columns 
WHERE table_name = 'events_with_details'
ORDER BY ordinal_position;



