-- Walk-in attendance v1: per-event flag, booking source, guest designation, provisional user origin

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS allow_walk_in_registration BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE event_bookings
  ADD COLUMN IF NOT EXISTS registration_source TEXT NOT NULL DEFAULT 'self';

ALTER TABLE event_bookings
  ADD COLUMN IF NOT EXISTS guest_designation TEXT NULL;

ALTER TABLE event_bookings
  ADD COLUMN IF NOT EXISTS capacity_override_note TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_bookings_registration_source_check'
  ) THEN
    ALTER TABLE event_bookings
      ADD CONSTRAINT event_bookings_registration_source_check
      CHECK (registration_source IN ('self', 'walk_in_scan', 'walk_in_guest', 'admin'));
  END IF;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_origin TEXT NULL;

COMMENT ON COLUMN events.allow_walk_in_registration IS
  'When true, door drop-ins can register via signed-in QR scan or guest name/email/designation form';
COMMENT ON COLUMN event_bookings.registration_source IS
  'How the booking was created: self | walk_in_scan | walk_in_guest | admin';
COMMENT ON COLUMN event_bookings.guest_designation IS
  'Designation captured at guest walk-in check-in (door audit)';
COMMENT ON COLUMN users.account_origin IS
  'walk_in_guest for provisional accounts created at the door; null for normal signups';

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
