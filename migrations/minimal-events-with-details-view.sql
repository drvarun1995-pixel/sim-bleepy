-- =====================================================
-- MINIMAL EVENTS_WITH_DETAILS VIEW - BOOKING FIELDS ONLY
-- =====================================================
-- This creates a simple view with just the essential fields
-- Focus: Fix booking checkbox persistence
-- =====================================================

BEGIN;

-- Drop the existing view
DROP VIEW IF EXISTS events_with_details;

-- Create a minimal view with just the essential fields
CREATE VIEW events_with_details AS
SELECT 
  -- All events columns (this includes all booking fields)
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
  e.category_ids,
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
  -- All booking fields
  e.booking_enabled,
  e.booking_button_label,
  e.booking_capacity,
  e.booking_deadline_hours,
  e.allow_waitlist,
  e.confirmation_checkbox_1_text,
  e.confirmation_checkbox_1_required,
  e.confirmation_checkbox_2_text,
  e.confirmation_checkbox_2_required,
  
  -- Basic location details
  l.name as location_name,
  l.address as location_address,
  l.latitude as location_latitude,
  l.longitude as location_longitude,
  
  -- Basic category details
  c.name as category_name,
  c.color as category_color,
  c.slug as category_slug,
  
  -- Basic format details
  f.name as format_name,
  f.color as format_color,
  f.slug as format_slug,
  
  -- Basic organizer details
  o.name as organizer_name,
  
  -- Basic author details (only if not already in events table)
  u.email as author_email,
  u.role as author_role

FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN users u ON e.author_id = u.id;

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'MINIMAL EVENTS_WITH_DETAILS VIEW CREATED';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'This view includes:';
  RAISE NOTICE '  - ALL booking fields from events table (e.*)';
  RAISE NOTICE '  - Basic location, category, format, organizer, author info';
  RAISE NOTICE '  - No complex JSON aggregations that might fail';
  RAISE NOTICE '';
  RAISE NOTICE 'Booking checkbox persistence should now work!';
  RAISE NOTICE '=====================================================';
END $$;
