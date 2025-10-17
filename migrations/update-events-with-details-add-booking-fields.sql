-- =====================================================
-- UPDATE EVENTS_WITH_DETAILS VIEW TO INCLUDE BOOKING FIELDS
-- =====================================================
-- This ensures booking fields are available when loading events for editing
-- =====================================================

BEGIN;

-- Drop the existing view
DROP VIEW IF EXISTS events_with_details;

-- Recreate the view with booking fields included
CREATE VIEW events_with_details AS
SELECT 
  e.*,
  -- Location details
  l.name as location_name,
  l.address as location_address,
  l.latitude as location_latitude,
  l.longitude as location_longitude,
  
  -- Category details
  c.name as category_name,
  c.color as category_color,
  c.slug as category_slug,
  
  -- Format details
  f.name as format_name,
  f.color as format_color,
  f.slug as format_slug,
  
  -- Organizer details
  o.name as organizer_name,
  o.email as organizer_email,
  o.phone as organizer_phone,
  
  -- Author details
  u.name as author_name,
  u.email as author_email,
  u.role as author_role,
  
  -- Additional location details (for multiple locations)
  CASE 
    WHEN json_agg(DISTINCT loc.id) FILTER (WHERE loc.id IS NOT NULL) IS NOT NULL
    THEN json_agg(DISTINCT jsonb_build_object(
      'id', loc.id,
      'name', loc.name,
      'address', loc.address,
      'latitude', loc.latitude,
      'longitude', loc.longitude
    )) FILTER (WHERE loc.id IS NOT NULL)
    ELSE NULL
  END as additional_locations,
  
  -- Additional category details (for multiple categories)
  CASE 
    WHEN json_agg(DISTINCT cat.id) FILTER (WHERE cat.id IS NOT NULL) IS NOT NULL
    THEN json_agg(DISTINCT jsonb_build_object(
      'id', cat.id,
      'name', cat.name,
      'color', cat.color,
      'slug', cat.slug
    )) FILTER (WHERE cat.id IS NOT NULL)
    ELSE NULL
  END as additional_categories,
  
  -- Additional organizer details (for multiple organizers)
  CASE 
    WHEN json_agg(DISTINCT org.id) FILTER (WHERE org.id IS NOT NULL) IS NOT NULL
    THEN json_agg(DISTINCT jsonb_build_object(
      'id', org.id,
      'name', org.name,
      'email', org.email,
      'phone', org.phone
    )) FILTER (WHERE org.id IS NOT NULL)
    ELSE NULL
  END as additional_organizers,
  
  -- Speaker details
  CASE 
    WHEN json_agg(DISTINCT s.id) FILTER (WHERE s.id IS NOT NULL) IS NOT NULL
    THEN json_agg(DISTINCT jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'title', s.title,
      'bio', s.bio,
      'photo_url', s.photo_url
    )) FILTER (WHERE s.id IS NOT NULL)
    ELSE NULL
  END as speakers

FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN users u ON e.author_id = u.id

-- Additional locations
LEFT JOIN event_locations el ON e.id = el.event_id
LEFT JOIN locations loc ON el.location_id = loc.id

-- Additional categories
LEFT JOIN event_categories ec ON e.id = ec.event_id
LEFT JOIN categories cat ON ec.category_id = cat.id

-- Additional organizers
LEFT JOIN event_organizers eo ON e.id = eo.event_id
LEFT JOIN organizers org ON eo.organizer_id = org.id

-- Speakers
LEFT JOIN event_speakers es ON e.id = es.event_id
LEFT JOIN speakers s ON es.speaker_id = s.id

GROUP BY 
  e.id, 
  l.id, l.name, l.address, l.latitude, l.longitude,
  c.id, c.name, c.color, c.slug,
  f.id, f.name, f.color, f.slug,
  o.id, o.name, o.email, o.phone,
  u.id, u.name, u.email, u.role;

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'EVENTS_WITH_DETAILS VIEW UPDATED';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'The view now includes all booking fields:';
  RAISE NOTICE '  - booking_enabled';
  RAISE NOTICE '  - booking_button_label';
  RAISE NOTICE '  - booking_capacity';
  RAISE NOTICE '  - booking_deadline_hours';
  RAISE NOTICE '  - allow_waitlist';
  RAISE NOTICE '  - confirmation_checkbox_1_text';
  RAISE NOTICE '  - confirmation_checkbox_1_required';
  RAISE NOTICE '  - confirmation_checkbox_2_text';
  RAISE NOTICE '  - confirmation_checkbox_2_required';
  RAISE NOTICE '';
  RAISE NOTICE 'Event editing should now load booking configuration properly!';
  RAISE NOTICE '=====================================================';
END $$;

