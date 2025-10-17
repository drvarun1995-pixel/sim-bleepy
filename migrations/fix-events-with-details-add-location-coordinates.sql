-- ============================================================================
-- FIX EVENTS WITH DETAILS VIEW - ADD LOCATION COORDINATES
-- ============================================================================
-- This migration updates the events_with_details view to include location
-- coordinates (latitude and longitude) from the locations table.
-- 
-- ISSUE: The view was missing location_latitude and location_longitude fields
-- which are needed by the GoogleMap component to display correct locations.
--
-- SOLUTION: Add l.latitude and l.longitude to the SELECT statement
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing events_with_details View';
  RAISE NOTICE 'Adding location coordinates';
  RAISE NOTICE '========================================';
END $$;

-- Drop and recreate the view with location coordinates
DROP VIEW IF EXISTS public.events_with_details CASCADE;

CREATE VIEW public.events_with_details
WITH (security_invoker = true) AS
SELECT 
    e.*,
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
LEFT JOIN public.organizers o ON e.organizer_id = o.id
GROUP BY e.id, c.name, c.color, f.name, f.color, l.name, l.address, l.latitude, l.longitude, o.name;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ events_with_details view updated!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added fields:';
  RAISE NOTICE '  - location_address';
  RAISE NOTICE '  - location_latitude';
  RAISE NOTICE '  - location_longitude';
  RAISE NOTICE '  - categories (array)';
  RAISE NOTICE '  - locations (array)';
  RAISE NOTICE '  - organizers (array)';
  RAISE NOTICE '  - speakers (array - improved)';
  RAISE NOTICE '';
  RAISE NOTICE 'The map component will now receive correct coordinates!';
  RAISE NOTICE '========================================';
END $$;

