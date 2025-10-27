-- =====================================================
-- SIMPLE DIRECT CHECK
-- =====================================================
-- This script does a basic check of what's actually in the database
-- =====================================================

-- Simple count of all events
SELECT 
  'Total Events' as check_type,
  COUNT(*) as count
FROM events;

-- Simple count of events with category_id
SELECT 
  'Events with category_id' as check_type,
  COUNT(*) as count
FROM events
WHERE category_id IS NOT NULL;

-- Simple count of events without category_id
SELECT 
  'Events without category_id' as check_type,
  COUNT(*) as count
FROM events
WHERE category_id IS NULL;

-- Show a few sample events with their category_id
SELECT 
  'Sample Events' as check_type,
  id,
  title,
  category_id
FROM events
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any events with invalid UUID category_id
SELECT 
  'Events with invalid UUID category_id' as check_type,
  COUNT(*) as count
FROM events
WHERE category_id IS NOT NULL 
  AND category_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
