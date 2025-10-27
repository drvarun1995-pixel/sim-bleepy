-- =====================================================
-- FIX EVENTS_WITH_DETAILS VIEW TO INCLUDE CATEGORY COLORS
-- =====================================================
-- This script adds the missing category_color column
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'FIXING EVENTS_WITH_DETAILS VIEW TO INCLUDE COLORS';
  RAISE NOTICE '=====================================================';
END $$;

-- Drop the current view
DROP VIEW IF EXISTS events_with_details CASCADE;

-- Recreate the view with category colors included
CREATE VIEW events_with_details AS
SELECT 
  e.id,
  e.title,
  e.description,
  e.date,
  e.start_time,
  e.end_time,
  e.is_all_day,
  e.hide_time,
  e.hide_end_time,
  e.time_notes,
  e.location_id,
  e.other_location_ids,
  e.hide_location,
  e.organizer_id,
  e.other_organizer_ids,
  e.hide_organizer,
  e.category_id,
  e.format_id,
  e.hide_speakers,
  e.event_link,
  e.more_info_link,
  e.more_info_target,
  e.event_status,
  e.attendees,
  e.status,
  e.author_id,
  e.author_name,
  e.created_at,
  e.updated_at,
  
  -- Basic joined data with colors
  c.name as category_name,
  c.color as category_color,
  f.name as format_name,
  l.name as location_name,
  o.name as organizer_name

FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id;

-- Add comment
COMMENT ON VIEW events_with_details IS 'Events view with category colors - fixed version';

-- Test the view
SELECT 
  'View Test' as check_type,
  COUNT(*) as event_count
FROM events_with_details;

-- Get a sample event to verify it works
SELECT 
  'Sample Event' as check_type,
  id,
  title,
  date,
  status,
  category_name,
  category_color,
  format_name,
  location_name,
  organizer_name
FROM events_with_details 
LIMIT 1;

-- Check events with categories
SELECT 
  'Events with Categories' as check_type,
  COUNT(*) as count
FROM events_with_details
WHERE category_id IS NOT NULL AND category_name IS NOT NULL;

-- Check events without categories
SELECT 
  'Events without Categories' as check_type,
  COUNT(*) as count
FROM events_with_details
WHERE category_id IS NULL OR category_name IS NULL;

-- Commit transaction
COMMIT;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ EVENTS_WITH_DETAILS VIEW FIXED WITH COLORS!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Added category_color column to the view';
  RAISE NOTICE 'Should now show proper category colors';
  RAISE NOTICE '=====================================================';
END $$;



