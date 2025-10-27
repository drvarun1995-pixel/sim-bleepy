-- =====================================================
-- FIX EVENTS_WITH_DETAILS VIEW TO USE FORMAT COLORS
-- =====================================================
-- This script changes the view to use format colors as primary color source
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'FIXING EVENTS_WITH_DETAILS VIEW TO USE FORMAT COLORS';
  RAISE NOTICE '=====================================================';
END $$;

-- Drop the current view
DROP VIEW IF EXISTS events_with_details CASCADE;

-- Recreate the view with format colors as primary color source
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
  
  -- Basic joined data
  c.name as category_name,
  c.color as category_color,
  f.name as format_name,
  f.color as format_color,
  l.name as location_name,
  o.name as organizer_name,
  
  -- Primary color field - use format color first, then category color as fallback
  COALESCE(f.color, c.color) as primary_color

FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id;

-- Add comment
COMMENT ON VIEW events_with_details IS 'Events view with format colors as primary color source';

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

-- Check color distribution
SELECT 
  'Color Distribution' as check_type,
  primary_color,
  COUNT(*) as count
FROM events_with_details
WHERE primary_color IS NOT NULL
GROUP BY primary_color
ORDER BY count DESC;

-- Check events without any color
SELECT 
  'Events without Color' as check_type,
  COUNT(*) as count
FROM events_with_details
WHERE primary_color IS NULL;

-- Commit transaction
COMMIT;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ EVENTS_WITH_DETAILS VIEW FIXED FOR FORMAT COLORS!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Now uses format colors as primary color source';
  RAISE NOTICE 'Falls back to category colors if no format color';
  RAISE NOTICE 'Added primary_color field for easy frontend use';
  RAISE NOTICE '=====================================================';
END $$;



