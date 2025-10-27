-- Fix events_with_details view to avoid duplicates
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
  
  -- Booking fields
  e.booking_enabled,
  e.booking_capacity,
  e.booking_deadline_hours,
  e.booking_button_label,
  
  -- QR Attendance field
  e.qr_attendance_enabled,
  
  -- Get primary category from junction table (first one)
  (SELECT c.name FROM event_categories ec2 
   JOIN categories c ON ec2.category_id = c.id 
   WHERE ec2.event_id = e.id LIMIT 1) as category_name,
  
  (SELECT c.color FROM event_categories ec2 
   JOIN categories c ON ec2.category_id = c.id 
   WHERE ec2.event_id = e.id LIMIT 1) as category_color,
  
  -- Format information
  f.name as format_name,
  f.color as format_color,
  
  -- Location information
  l.name as location_name,
  
  -- Locations as objects array (for frontend)
  (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', l2.id, 'name', l2.name, 'address', l2.address)), '[]'::json) 
   FROM event_locations el2 
   JOIN locations l2 ON el2.location_id = l2.id 
   WHERE el2.event_id = e.id) as locations,
  
  -- Organizer information
  o.name as organizer_name,
  
  -- Organizers as objects array (for frontend)
  (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', o2.id, 'name', o2.name)), '[]'::json) 
   FROM event_organizers eo2 
   JOIN organizers o2 ON eo2.organizer_id = o2.id 
   WHERE eo2.event_id = e.id) as organizers,
  
  -- Speakers as objects array (for frontend)
  (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', s.id, 'name', s.name, 'role', s.role)), '[]'::json) 
   FROM event_speakers es2 
   JOIN speakers s ON es2.speaker_id = s.id 
   WHERE es2.event_id = e.id) as speakers,
  
  -- Primary color (format first, then category)
  COALESCE(f.color, (SELECT c.color FROM event_categories ec2 
                     JOIN categories c ON ec2.category_id = c.id 
                     WHERE ec2.event_id = e.id LIMIT 1)) as primary_color,
  
  -- All categories as array
  (SELECT ARRAY_AGG(c.name) FROM event_categories ec2 
   JOIN categories c ON ec2.category_id = c.id 
   WHERE ec2.event_id = e.id) as all_category_names,
  
  (SELECT ARRAY_AGG(c.color) FROM event_categories ec2 
   JOIN categories c ON ec2.category_id = c.id 
   WHERE ec2.event_id = e.id) as all_category_colors,
  
  -- Categories as objects array (for frontend)
  (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', c.id, 'name', c.name, 'color', c.color)), '[]'::json) 
   FROM event_categories ec2 
   JOIN categories c ON ec2.category_id = c.id 
   WHERE ec2.event_id = e.id) as categories

FROM events e
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id;
