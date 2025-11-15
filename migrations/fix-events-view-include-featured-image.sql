-- ============================================================================
-- REFRESH EVENTS_WITH_DETAILS VIEW TO INCLUDE FEATURED IMAGE COLUMN
-- ============================================================================
-- This recreates the events_with_details view using the safe pattern that
-- selects e.* (so new columns like featured_image automatically flow through)
-- while keeping security_invoker and authenticated access intact.
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Refreshing events_with_details view (featured_image support)';
  RAISE NOTICE '========================================';
END $$;

DROP VIEW IF EXISTS public.events_with_details CASCADE;

CREATE VIEW public.events_with_details
WITH (security_invoker = true) AS
SELECT
  e.*, -- Includes featured_image and all future event columns
  c.name AS category_name,
  c.color AS category_color,
  f.name AS format_name,
  f.color AS format_color,
  l.name AS location_name,
  l.address AS location_address,
  l.latitude AS location_latitude,
  l.longitude AS location_longitude,
  o.name AS organizer_name,
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
  ) AS categories,
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
  ) AS locations,
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
  ) AS organizers,
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
  ) AS speakers
FROM public.events e
LEFT JOIN public.categories c ON e.category_id = c.id
LEFT JOIN public.formats f ON e.format_id = f.id
LEFT JOIN public.locations l ON e.location_id = l.id
LEFT JOIN public.organizers o ON e.organizer_id = o.id;

GRANT SELECT ON public.events_with_details TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ events_with_details view now exposes featured_image';
  RAISE NOTICE '========================================';
END $$;

