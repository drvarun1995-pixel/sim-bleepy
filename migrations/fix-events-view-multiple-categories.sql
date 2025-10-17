-- ============================================================================
-- FIX EVENTS_WITH_DETAILS VIEW - RESTORE MULTIPLE CATEGORIES SUPPORT
-- ============================================================================
-- This migration restores the proper events_with_details view that supports
-- multiple categories, locations, and organizers through junction tables.
-- 
-- ISSUE: The simple view only supports single category_id, breaking category
-- filtering and dashboard personalization that rely on multiple categories.
--
-- SOLUTION: Restore the full view with junction table support
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing events_with_details View';
  RAISE NOTICE 'Restoring multiple categories support';
  RAISE NOTICE '========================================';
END $$;

-- Drop and recreate the view with full junction table support
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
  RAISE NOTICE '✅ events_with_details view restored!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Restored support for:';
  RAISE NOTICE '  - Multiple categories (categories array)';
  RAISE NOTICE '  - Multiple locations (locations array)';
  RAISE NOTICE '  - Multiple organizers (organizers array)';
  RAISE NOTICE '  - Multiple speakers (speakers array)';
  RAISE NOTICE '  - All booking fields';
  RAISE NOTICE '  - Location coordinates';
  RAISE NOTICE '';
  RAISE NOTICE 'Category filtering should now work properly!';
  RAISE NOTICE 'Dashboard personalization should now work!';
  RAISE NOTICE '========================================';
END $$;
