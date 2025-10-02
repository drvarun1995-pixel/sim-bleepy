-- UPDATE EVENTS VIEW TO INCLUDE ALL MULTIPLE RELATIONSHIPS
-- Adds locations, organizers, speakers, and categories arrays

DROP VIEW IF EXISTS public.events_with_details CASCADE;

CREATE OR REPLACE VIEW public.events_with_details AS
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
  l.name AS location_name,
  l.address AS location_address,
  l.latitude AS location_latitude,
  l.longitude AS location_longitude,
  -- Get all locations as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', loc.id, 'name', loc.name, 'address', loc.address))
     FROM event_locations el
     JOIN locations loc ON loc.id = el.location_id
     WHERE el.event_id = e.id),
    '[]'::json
  ) AS locations,
  e.hide_location,
  e.organizer_id,
  o.name AS organizer_name,
  -- Get all organizers as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', org.id, 'name', org.name))
     FROM event_organizers eo
     JOIN organizers org ON org.id = eo.organizer_id
     WHERE eo.event_id = e.id),
    '[]'::json
  ) AS organizers,
  e.hide_organizer,
  e.category_id,
  c.name AS category_name,
  -- Get all categories as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', cat.id, 'name', cat.name, 'color', cat.color))
     FROM event_categories ec
     JOIN categories cat ON cat.id = ec.category_id
     WHERE ec.event_id = e.id),
    '[]'::json
  ) AS categories,
  e.format_id,
  f.name AS format_name,
  f.color AS format_color,
  -- Get all speakers as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', sp.id, 'name', sp.name, 'role', sp.role))
     FROM event_speakers es
     JOIN speakers sp ON sp.id = es.speaker_id
     WHERE es.event_id = e.id),
    '[]'::json
  ) AS speakers,
  e.hide_speakers,
  e.attendees,
  e.status,
  e.event_link,
  e.more_info_link,
  e.more_info_target,
  e.event_status,
  e.author_id,
  u.name AS author_name,
  u.email AS author_email,
  e.created_at,
  e.updated_at
FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN users u ON e.author_id = u.id;

-- Grant permissions
GRANT SELECT ON public.events_with_details TO authenticated, anon;

