-- =====================================================
-- RESTORE EVENTS_WITH_DETAILS VIEW TO ORIGINAL STATE
-- =====================================================
-- This script restores the view to exactly what it was before
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'RESTORING EVENTS_WITH_DETAILS VIEW TO ORIGINAL STATE';
  RAISE NOTICE '=====================================================';
END $$;

-- Drop the current broken view
DROP VIEW IF EXISTS events_with_details CASCADE;

-- Recreate the original simple view that was working
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
  
  -- Basic joined data (simple, like it was before)
  c.name as category_name,
  f.name as format_name,
  l.name as location_name,
  o.name as organizer_name

FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id;

-- Add comment
COMMENT ON VIEW events_with_details IS 'Original events view - restored to working state';

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
  format_name,
  location_name,
  organizer_name
FROM events_with_details 
LIMIT 1;

-- Commit transaction
COMMIT;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ EVENTS_WITH_DETAILS VIEW RESTORED!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Restored to original simple working state';
  RAISE NOTICE 'Should now show events on all pages again';
  RAISE NOTICE '=====================================================';
END $$;



