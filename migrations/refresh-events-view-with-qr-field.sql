-- Refresh the events_with_details view to ensure it includes qr_attendance_enabled field
-- Drop and recreate the view to ensure it's up to date

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
  
  -- Location details
  l.name as location_name,
  l.address as location_address,
  l.latitude as location_latitude,
  l.longitude as location_longitude,
  
  -- Organizer details
  o.name as organizer_name,
  o.email as organizer_email,
  
  -- Category details
  c.name as category_name,
  c.color as category_color,
  c.slug as category_slug,
  
  -- Format details
  f.name as format_name,
  f.color as format_color,
  f.slug as format_slug,
  
  -- Primary color (prioritize format color)
  COALESCE(f.color, c.color, '#3B82F6') as primary_color,
  
  -- Booking fields
  e.booking_enabled,
  e.booking_capacity,
  e.booking_deadline_hours,
  e.booking_button_label,
  e.allow_waitlist,
  e.confirmation_checkbox_1_text,
  e.confirmation_checkbox_1_required,
  e.confirmation_checkbox_2_text,
  e.confirmation_checkbox_2_required,
  e.cancellation_deadline_hours,
  e.allowed_roles,
  e.approval_mode,
  
  -- QR Attendance field
  e.qr_attendance_enabled,
  
  -- Auto-certificate fields
  e.feedback_required_for_certificate,
  e.feedback_deadline_days,
  e.auto_generate_certificate,
  e.certificate_template_id,
  e.certificate_auto_send_email,
  
  -- Get categories as JSON array
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', c2.id,
        'name', c2.name,
        'color', c2.color,
        'slug', c2.slug
      )
    ) FROM event_categories ec2 
     JOIN categories c2 ON ec2.category_id = c2.id 
     WHERE ec2.event_id = e.id),
    '[]'::json
  ) as categories,
  
  -- Get locations as JSON array
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', l2.id,
        'name', l2.name,
        'address', l2.address,
        'latitude', l2.latitude,
        'longitude', l2.longitude
      )
    ) FROM event_locations el2 
     JOIN locations l2 ON el2.location_id = l2.id 
     WHERE el2.event_id = e.id),
    '[]'::json
  ) as locations,
  
  -- Get organizers as JSON array
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', o2.id,
        'name', o2.name,
        'email', o2.email
      )
    ) FROM event_organizers eo2 
     JOIN organizers o2 ON eo2.organizer_id = o2.id 
     WHERE eo2.event_id = e.id),
    '[]'::json
  ) as organizers,
  
  -- Get speakers as JSON array
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', s2.id,
        'name', s2.name,
        'role', s2.role
      )
    ) FROM event_speakers es2 
     JOIN speakers s2 ON es2.speaker_id = s2.id 
     WHERE es2.event_id = e.id),
    '[]'::json
  ) as speakers

FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id;

-- Grant permissions
GRANT SELECT ON events_with_details TO authenticated;
GRANT SELECT ON events_with_details TO anon;

-- Add comment
COMMENT ON VIEW events_with_details IS 'Comprehensive view of events with all related data including QR attendance tracking';

