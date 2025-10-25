-- =====================================================
-- FIX EVENTS_WITH_DETAILS VIEW TO PROPERLY HANDLE ADDITIONAL ORGANIZERS
-- =====================================================
-- This fixes the view to include additional organizers from other_organizer_ids array
-- =====================================================

BEGIN;

-- Drop the existing view
DROP VIEW IF EXISTS events_with_details;

-- Recreate the view with proper organizer handling
CREATE VIEW events_with_details AS
SELECT 
  -- All events columns
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
  e.cancellation_deadline_hours,
  e.allowed_roles,
  e.approval_mode,
  
  -- QR Code fields
  e.qr_attendance_enabled,
  e.auto_generate_certificate,
  e.certificate_generation_mode,
  e.feedback_required_for_certificate,
  e.feedback_deadline_days,
  e.certificate_template_id,
  e.certificate_auto_send_email,
  
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
  
  -- Main organizer details
  o.name as organizer_name,
  
  -- Additional organizers from other_organizer_ids array
  CASE 
    WHEN e.other_organizer_ids IS NOT NULL AND array_length(e.other_organizer_ids, 1) > 0
    THEN json_agg(
      DISTINCT jsonb_build_object(
        'id', o_other.id,
        'name', o_other.name
      )
    ) FILTER (WHERE o_other.id IS NOT NULL)
    ELSE NULL
  END as other_organizers,
  
  -- All organizers combined (main + additional)
  CASE 
    WHEN e.other_organizer_ids IS NOT NULL AND array_length(e.other_organizer_ids, 1) > 0
    THEN json_agg(
      DISTINCT jsonb_build_object(
        'id', COALESCE(o.id, o_other.id),
        'name', COALESCE(o.name, o_other.name),
        'is_main', CASE WHEN o.id IS NOT NULL THEN true ELSE false END
      )
    ) FILTER (WHERE COALESCE(o.id, o_other.id) IS NOT NULL)
    ELSE 
      CASE 
        WHEN o.id IS NOT NULL 
        THEN json_build_array(jsonb_build_object('id', o.id, 'name', o.name, 'is_main', true))
        ELSE NULL
      END
  END as organizers,
  
  -- Basic author details
  u.email as author_email,
  u.role as author_role

FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN organizers o_other ON o_other.id = ANY(e.other_organizer_ids)
LEFT JOIN users u ON e.author_id = u.id
GROUP BY 
  e.id, e.title, e.description, e.date, e.start_time, e.end_time, e.is_all_day,
  e.hide_time, e.hide_end_time, e.time_notes, e.location_id, e.other_location_ids,
  e.hide_location, e.organizer_id, e.other_organizer_ids, e.hide_organizer,
  e.category_id, e.category_ids, e.format_id, e.hide_speakers, e.event_link,
  e.more_info_link, e.more_info_target, e.event_status, e.attendees, e.status,
  e.author_id, e.author_name, e.created_at, e.updated_at,
  e.booking_enabled, e.booking_button_label, e.booking_capacity, e.booking_deadline_hours,
  e.allow_waitlist, e.confirmation_checkbox_1_text, e.confirmation_checkbox_1_required,
  e.confirmation_checkbox_2_text, e.confirmation_checkbox_2_required,
  e.cancellation_deadline_hours, e.allowed_roles, e.approval_mode,
  e.qr_attendance_enabled, e.auto_generate_certificate, e.certificate_generation_mode,
  e.feedback_required_for_certificate, e.feedback_deadline_days, e.certificate_template_id,
  e.certificate_auto_send_email,
  l.name, l.address, l.latitude, l.longitude,
  c.name, c.color, c.slug,
  f.name, f.color, f.slug,
  o.name,
  u.email, u.role;

COMMIT;


