-- =====================================================
-- CHECK SPECIFIC EVENT CATEGORY DATA
-- =====================================================
-- This script checks the specific event you mentioned
-- =====================================================

-- Check the specific event in the events table
SELECT 
  'Direct Event Data' as check_type,
  id,
  title,
  category_id,
  format_id
FROM events
WHERE id = 'd2c88fb4-1d3b-4fe2-b733-eb248977e33c';

-- Check what the events_with_details view returns for this event
SELECT 
  'Events View Data' as check_type,
  id,
  title,
  category_id,
  category_name,
  category_color,
  format_id,
  format_name,
  format_color,
  primary_color
FROM events_with_details
WHERE id = 'd2c88fb4-1d3b-4fe2-b733-eb248977e33c';

-- Check if the category exists
SELECT 
  'Category Data' as check_type,
  id,
  name,
  color
FROM categories
WHERE id = (
  SELECT category_id 
  FROM events 
  WHERE id = 'd2c88fb4-1d3b-4fe2-b733-eb248977e33c'
);

-- Check if the format exists
SELECT 
  'Format Data' as check_type,
  id,
  name,
  color
FROM formats
WHERE id = (
  SELECT format_id 
  FROM events 
  WHERE id = 'd2c88fb4-1d3b-4fe2-b733-eb248977e33c'
);



