-- Fix the events_with_details view to show categories properly
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
  c.name as category_name,
  c.color as category_color,
  f.name as format_name,
  f.color as format_color,
  l.name as location_name,
  o.name as organizer_name
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id;



