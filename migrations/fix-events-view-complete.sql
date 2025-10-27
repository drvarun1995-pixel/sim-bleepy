-- =====================================================
-- FIX EVENTS_WITH_DETAILS VIEW COMPLETELY
-- =====================================================
-- This script fixes the events_with_details view with all missing columns
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'FIXING EVENTS_WITH_DETAILS VIEW COMPLETELY';
  RAISE NOTICE '=====================================================';
END $$;

-- Drop the current broken view
DROP VIEW IF EXISTS events_with_details CASCADE;

-- Recreate the view with ALL necessary columns
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
  
  -- Category information
  c.name as category_name,
  c.color as category_color,
  
  -- Format information
  f.name as format_name,
  f.color as format_color,
  
  -- Location information
  l.name as location_name,
  
  -- Organizer information
  o.name as organizer_name,
  
  -- Primary color (format first, then category)
  COALESCE(f.color, c.color) as primary_color

FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id;

-- Add comment
COMMENT ON VIEW events_with_details IS 'Complete events view with all necessary columns for frontend';

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
  format_color,
  primary_color
FROM events_with_details 
LIMIT 5;

-- Commit transaction
COMMIT;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ EVENTS_WITH_DETAILS VIEW COMPLETELY FIXED!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Added all missing columns:';
  RAISE NOTICE '✓ category_color';
  RAISE NOTICE '✓ format_color';
  RAISE NOTICE '✓ organizer_name';
  RAISE NOTICE '✓ primary_color';
  RAISE NOTICE '=====================================================';
END $$;



