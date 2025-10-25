-- =====================================================
-- COMPREHENSIVE ORGANIZERS SOLUTION
-- =====================================================
-- This creates a proper system for managing additional organizers
-- =====================================================

-- Step 1: Create the event_organizers junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    is_main_organizer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combinations
    UNIQUE(event_id, organizer_id)
);

-- Enable RLS
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all for now)
CREATE POLICY "Allow all operations on event_organizers" ON event_organizers FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_organizers_event_id ON event_organizers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_organizer_id ON event_organizers(organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_is_main ON event_organizers(is_main_organizer);

-- Step 2: Migrate existing organizer data to the junction table
-- This will populate the event_organizers table with current data

-- First, insert main organizers
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    e.organizer_id,
    TRUE as is_main_organizer
FROM events e
WHERE e.organizer_id IS NOT NULL
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- Then, insert additional organizers from other_organizer_ids array
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    unnest(e.other_organizer_ids) as organizer_id,
    FALSE as is_main_organizer
FROM events e
WHERE e.other_organizer_ids IS NOT NULL 
AND array_length(e.other_organizer_ids, 1) > 0
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- Step 3: Update the events_with_details view to use the junction table
DROP VIEW IF EXISTS events_with_details;

CREATE VIEW events_with_details AS
SELECT 
  e.*,
  
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
  
  -- Main organizer details (from junction table)
  o_main.name as organizer_name,
  
  -- All organizers from junction table (both main and additional)
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', o_junction.id,
        'name', o_junction.name,
        'is_main', eo.is_main_organizer
      )
    ) FILTER (WHERE o_junction.id IS NOT NULL),
    '[]'::json
  ) as organizers,
  
  -- Additional organizers only (from junction table)
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', o_junction.id,
        'name', o_junction.name
      )
    ) FILTER (WHERE o_junction.id IS NOT NULL AND eo.is_main_organizer = FALSE),
    '[]'::json
  ) as other_organizers

FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN event_organizers eo ON e.id = eo.event_id
LEFT JOIN organizers o_junction ON eo.organizer_id = o_junction.id
LEFT JOIN organizers o_main ON e.organizer_id = o_main.id
GROUP BY 
  e.id, e.title, e.description, e.date, e.start_time, e.end_time, e.is_all_day,
  e.hide_time, e.hide_end_time, e.time_notes, e.location_id, e.other_location_ids,
  e.hide_location, e.organizer_id, e.other_organizer_ids, e.hide_organizer,
  e.category_id, e.format_id, e.hide_speakers, e.event_link,
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
  o_main.id, o_main.name;

-- Step 4: Create helper functions for managing organizers

-- Function to add an organizer to an event
CREATE OR REPLACE FUNCTION add_organizer_to_event(
    p_event_id UUID,
    p_organizer_id UUID,
    p_is_main BOOLEAN DEFAULT FALSE
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
    VALUES (p_event_id, p_organizer_id, p_is_main)
    ON CONFLICT (event_id, organizer_id) 
    DO UPDATE SET is_main_organizer = p_is_main;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to remove an organizer from an event
CREATE OR REPLACE FUNCTION remove_organizer_from_event(
    p_event_id UUID,
    p_organizer_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM event_organizers 
    WHERE event_id = p_event_id AND organizer_id = p_organizer_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all organizers for an event
CREATE OR REPLACE FUNCTION get_event_organizers(p_event_id UUID)
RETURNS TABLE(
    organizer_id UUID,
    organizer_name TEXT,
    is_main BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        eo.is_main_organizer
    FROM event_organizers eo
    JOIN organizers o ON eo.organizer_id = o.id
    WHERE eo.event_id = p_event_id
    ORDER BY eo.is_main_organizer DESC, o.name;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Test the new system
SELECT 
    'Testing new organizers system' as test_name,
    COUNT(*) as total_events,
    COUNT(CASE WHEN organizers IS NOT NULL AND json_array_length(organizers::json) > 0 THEN 1 END) as events_with_organizers,
    COUNT(CASE WHEN other_organizers IS NOT NULL AND json_array_length(other_organizers::json) > 0 THEN 1 END) as events_with_additional_organizers
FROM events_with_details;

-- Show sample events with organizers
SELECT 
    id,
    title,
    organizer_name,
    json_array_length(organizers::json) as total_organizers,
    json_array_length(other_organizers::json) as additional_organizers,
    organizers,
    other_organizers
FROM events_with_details 
WHERE organizers IS NOT NULL 
AND json_array_length(organizers::json) > 0
ORDER BY title
LIMIT 5;


