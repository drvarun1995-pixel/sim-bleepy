-- ============================================================================
-- FIX EVENTS_WITH_DETAILS VIEW - ENSURE FEEDBACK_ENABLED IS INCLUDED
-- ============================================================================
-- This migration ensures the events_with_details view includes feedback_enabled
-- by recreating it with the same pattern as the working view (using e.*)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing events_with_details view - ensuring feedback_enabled';
  RAISE NOTICE '========================================';
END $$;

-- Drop and recreate the events_with_details view using the same pattern as the working view
DROP VIEW IF EXISTS public.events_with_details CASCADE;

CREATE VIEW public.events_with_details
WITH (security_invoker = true) AS
SELECT 
    e.*,  -- This includes ALL columns from events table, including feedback_enabled
    c.name as category_name,
    c.color as category_color,
    f.name as format_name,
    f.color as format_color,
    l.name as location_name,
    l.address as location_address,
    l.latitude as location_latitude,
    l.longitude as location_longitude,
    o.name as organizer_name,
    -- Categories array (for multiple categories)
    COALESCE(
        (
            SELECT json_agg(
                jsonb_build_object(
                    'id', cat.id,
                    'name', cat.name,
                    'color', cat.color
                )
            )
            FROM event_categories ec
            LEFT JOIN categories cat ON ec.category_id = cat.id
            WHERE ec.event_id = e.id
        ),
        '[]'::json
    ) as categories,
    -- Locations array (for multiple locations)
    COALESCE(
        (
            SELECT json_agg(
                jsonb_build_object(
                    'id', loc.id,
                    'name', loc.name,
                    'address', loc.address,
                    'latitude', loc.latitude,
                    'longitude', loc.longitude
                )
            )
            FROM event_locations el
            LEFT JOIN locations loc ON el.location_id = loc.id
            WHERE el.event_id = e.id
        ),
        '[]'::json
    ) as locations,
    -- Organizers array (for multiple organizers)
    COALESCE(
        (
            SELECT json_agg(
                jsonb_build_object(
                    'id', org.id,
                    'name', org.name
                )
            )
            FROM event_organizers eo
            LEFT JOIN organizers org ON eo.organizer_id = org.id
            WHERE eo.event_id = e.id
        ),
        '[]'::json
    ) as organizers,
    -- Speakers array
    COALESCE(
        (
            SELECT json_agg(
                jsonb_build_object(
                    'id', sp.id,
                    'name', sp.name,
                    'role', sp.role
                )
            )
            FROM event_speakers es
            LEFT JOIN speakers sp ON es.speaker_id = sp.id
            WHERE es.event_id = e.id
        ),
        '[]'::json
    ) as speakers
FROM public.events e
LEFT JOIN public.categories c ON e.category_id = c.id
LEFT JOIN public.formats f ON e.format_id = f.id
LEFT JOIN public.locations l ON e.location_id = l.id
LEFT JOIN public.organizers o ON e.organizer_id = o.id;

-- Grant permissions on the updated view
GRANT SELECT ON events_with_details TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ events_with_details view fixed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added feedback_enabled column to the view';
  RAISE NOTICE 'View recreated with security_invoker = true';
  RAISE NOTICE 'Permissions granted to authenticated users';
  RAISE NOTICE '========================================';
END $$;
