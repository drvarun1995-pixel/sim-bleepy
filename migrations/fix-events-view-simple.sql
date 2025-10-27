-- =====================================================
-- FIX EVENTS_WITH_DETAILS VIEW - SIMPLE VERSION
-- =====================================================
-- This script recreates the view to match what the frontend expects
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'FIXING EVENTS_WITH_DETAILS VIEW - SIMPLE VERSION';
  RAISE NOTICE '=====================================================';
END $$;

-- Drop and recreate the events_with_details view with simpler structure
DROP VIEW IF EXISTS events_with_details CASCADE;

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
  f.name as format_name,
  l.name as location_name,
  o.name as organizer_name,
  
  -- Speaker data as arrays (what frontend expects)
  COALESCE(
    ARRAY_AGG(DISTINCT jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'role', s.role
    )) FILTER (WHERE s.id IS NOT NULL),
    ARRAY[]::jsonb[]
  ) as speakers,
  
  -- Category data as arrays
  COALESCE(
    ARRAY_AGG(DISTINCT jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'color', c.color
    )) FILTER (WHERE c.id IS NOT NULL),
    ARRAY[]::jsonb[]
  ) as categories,
  
  -- Location data as arrays
  COALESCE(
    ARRAY_AGG(DISTINCT jsonb_build_object(
      'id', l.id,
      'name', l.name,
      'address', l.address
    )) FILTER (WHERE l.id IS NOT NULL),
    ARRAY[]::jsonb[]
  ) as locations,
  
  -- Organizer data as arrays
  COALESCE(
    ARRAY_AGG(DISTINCT jsonb_build_object(
      'id', o.id,
      'name', o.name
    )) FILTER (WHERE o.id IS NOT NULL),
    ARRAY[]::jsonb[]
  ) as organizers,
  
  -- Legacy single-value columns for backward compatibility
  c.name as category,
  f.name as format,
  l.name as location,
  o.name as organizer

FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN event_speakers es ON e.id = es.event_id
LEFT JOIN speakers s ON es.speaker_id = s.id
GROUP BY 
  e.id, e.title, e.description, e.date, e.start_time, e.end_time, 
  e.is_all_day, e.hide_time, e.hide_end_time, e.time_notes,
  e.location_id, e.other_location_ids, e.hide_location,
  e.organizer_id, e.other_organizer_ids, e.hide_organizer,
  e.category_id, e.format_id, e.hide_speakers,
  e.event_link, e.more_info_link, e.more_info_target,
  e.event_status, e.attendees, e.status, e.author_id, e.author_name,
  e.created_at, e.updated_at,
  c.name, c.slug, c.color,
  f.name, f.slug, f.color,
  l.name, l.address,
  o.name;

-- Add comment
COMMENT ON VIEW events_with_details IS 'Complete events view with all related data for frontend display';

-- Test the view
SELECT 
  'View Test' as check_type,
  COUNT(*) as event_count
FROM events_with_details;

-- Get a sample event to verify structure
SELECT 
  'Sample Event' as check_type,
  id,
  title,
  date,
  status,
  speakers,
  categories,
  locations,
  organizers
FROM events_with_details 
LIMIT 1;

-- Commit transaction
COMMIT;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ EVENTS_WITH_DETAILS VIEW FIXED!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Fixed speakers to be an array (not string)';
  RAISE NOTICE 'Added proper arrays for categories, locations, organizers';
  RAISE NOTICE 'View should now work properly on all pages!';
  RAISE NOTICE '=====================================================';
END $$;



