-- =====================================================
-- FIX EVENTS_WITH_DETAILS VIEW - ADD CATEGORIES FROM JUNCTION TABLE
-- =====================================================
-- This fixes the view to include categories from the event_categories junction table
-- so that multiple categories are properly loaded when editing events
-- =====================================================

BEGIN;

-- Drop the existing view
DROP VIEW IF EXISTS events_with_details;

-- Create the view with categories from junction table
CREATE VIEW events_with_details AS
SELECT 
  e.*,
  -- Location details
  l.name as location_name,
  l.address as location_address,
  l.latitude as location_latitude,
  l.longitude as location_longitude,
  
  -- Category details (main category)
  c.name as category_name,
  c.color as category_color,
  c.slug as category_slug,
  
  -- Format details
  f.name as format_name,
  f.color as format_color,
  f.slug as format_slug,
  
  -- Organizer details
  o.name as organizer_name,
  
  -- Author details
  u.email as author_email,
  u.role as author_role,
  
  -- Categories from junction table (for multiple categories)
  CASE 
    WHEN json_agg(DISTINCT cat.id) FILTER (WHERE cat.id IS NOT NULL) IS NOT NULL
    THEN json_agg(DISTINCT jsonb_build_object(
      'id', cat.id,
      'name', cat.name,
      'color', cat.color,
      'slug', cat.slug
    )) FILTER (WHERE cat.id IS NOT NULL)
    ELSE NULL
  END as categories,
  
  -- Organizers from junction table (for multiple organizers)
  CASE 
    WHEN json_agg(DISTINCT org.id) FILTER (WHERE org.id IS NOT NULL) IS NOT NULL
    THEN json_agg(DISTINCT jsonb_build_object(
      'id', org.id,
      'name', org.name
    )) FILTER (WHERE org.id IS NOT NULL)
    ELSE NULL
  END as organizers,
  
  -- Speakers from junction table (for multiple speakers)
  CASE 
    WHEN json_agg(DISTINCT sp.id) FILTER (WHERE sp.id IS NOT NULL) IS NOT NULL
    THEN json_agg(DISTINCT jsonb_build_object(
      'id', sp.id,
      'name', sp.name,
      'role', sp.role
    )) FILTER (WHERE sp.id IS NOT NULL)
    ELSE NULL
  END as speakers

FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN users u ON e.author_id = u.id
-- Junction tables for multiple relationships (only include existing tables)
LEFT JOIN event_categories ec ON e.id = ec.event_id
LEFT JOIN categories cat ON ec.category_id = cat.id
LEFT JOIN event_organizers eo ON e.id = eo.event_id
LEFT JOIN organizers org ON eo.organizer_id = org.id
LEFT JOIN event_speakers es ON e.id = es.event_id
LEFT JOIN speakers sp ON es.speaker_id = sp.id
GROUP BY 
  e.id, e.title, e.description, e.date, e.start_time, e.end_time, e.is_all_day, 
  e.hide_time, e.hide_end_time, e.time_notes, e.location_id, e.other_location_ids, 
  e.hide_location, e.organizer_id, e.other_organizer_ids, e.hide_organizer, 
  e.category_id, e.format_id, e.hide_speakers, e.event_link, e.more_info_link, 
  e.more_info_target, e.event_status, e.attendees, e.status, e.author_id, 
  e.author_name, e.created_at, e.updated_at, e.booking_enabled, e.booking_button_label, 
  e.booking_capacity, e.booking_deadline_hours, e.allow_waitlist, 
  e.confirmation_checkbox_1_text, e.confirmation_checkbox_1_required, 
  e.confirmation_checkbox_2_text, e.confirmation_checkbox_2_required,
  l.name, l.address, l.latitude, l.longitude,
  c.name, c.color, c.slug,
  f.name, f.color, f.slug,
  o.name,
  u.email, u.role;

COMMIT;
