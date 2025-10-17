-- =====================================================
-- SIMPLE EVENTS_WITH_DETAILS VIEW - BASIC FIELDS ONLY
-- =====================================================
-- This creates the simplest possible view that includes booking fields
-- =====================================================

BEGIN;

-- Drop the existing view
DROP VIEW IF EXISTS events_with_details;

-- Create a simple view with just basic fields we know exist
CREATE VIEW events_with_details AS
SELECT 
  -- Basic events columns (we know these exist)
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
  e.hide_location,
  e.organizer_id,
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
  
  -- All booking fields (we confirmed these exist from your screenshot)
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
  o.name as organizer_name

FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN organizers o ON e.organizer_id = o.id;

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'SIMPLE EVENTS_WITH_DETAILS VIEW CREATED';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'This view includes:';
  RAISE NOTICE '  - ALL booking fields (confirmed to exist)';
  RAISE NOTICE '  - Basic event, location, category, format, organizer info';
  RAISE NOTICE '  - No complex columns that might not exist';
  RAISE NOTICE '';
  RAISE NOTICE 'Booking checkbox persistence should now work!';
  RAISE NOTICE '=====================================================';
END $$;
