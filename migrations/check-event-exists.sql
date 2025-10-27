-- =====================================================
-- CHECK IF EVENT EXISTS
-- =====================================================
-- This script checks if the event exists in the database
-- =====================================================

-- Check if the event exists at all
SELECT 
  'Event Exists Check' as check_type,
  id,
  title,
  category_id,
  format_id,
  status,
  created_at
FROM events
WHERE id = 'd2c88fb4-1d3b-4fe2-b733-eb248977e33c';

-- Check if there are any events with similar IDs
SELECT 
  'Similar Event IDs' as check_type,
  id,
  title,
  category_id
FROM events
WHERE id::text LIKE '%d2c88fb4%' 
   OR id::text LIKE '%1d3b%'
   OR id::text LIKE '%b733%'
   OR id::text LIKE '%eb248977e33c%'
LIMIT 5;

-- Check recent events to see if this might be a different ID
SELECT 
  'Recent Events' as check_type,
  id,
  title,
  category_id,
  format_id
FROM events
ORDER BY created_at DESC
LIMIT 10;
