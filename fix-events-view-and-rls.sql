-- FIX EVENTS VIEW AND RLS POLICIES
-- This script fixes the events view to include multiple categories
-- and updates RLS policies to allow editing imported events

-- Step 1: Drop and recreate the events_with_details view to include multiple categories
DROP VIEW IF EXISTS public.events_with_details CASCADE;

CREATE OR REPLACE VIEW public.events_with_details AS
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
  l.name AS location_name,
  l.address AS location_address,
  l.latitude AS location_latitude,
  l.longitude AS location_longitude,
  e.hide_location,
  e.organizer_id,
  o.name AS organizer_name,
  e.hide_organizer,
  e.category_id,
  c.name AS category_name,
  -- Get all categories as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', cat.id, 'name', cat.name, 'color', cat.color))
     FROM event_categories ec
     JOIN categories cat ON cat.id = ec.category_id
     WHERE ec.event_id = e.id),
    '[]'::json
  ) AS categories,
  e.format_id,
  f.name AS format_name,
  f.color AS format_color,
  -- Get all speakers as an array
  COALESCE(
    (SELECT json_agg(json_build_object('id', sp.id, 'name', sp.name, 'role', sp.role))
     FROM event_speakers es
     JOIN speakers sp ON sp.id = es.speaker_id
     WHERE es.event_id = e.id),
    '[]'::json
  ) AS speakers,
  e.hide_speakers,
  e.attendees,
  e.status,
  e.event_link,
  e.more_info_link,
  e.more_info_target,
  e.event_status,
  e.author_id,
  u.name AS author_name,
  u.email AS author_email,
  e.created_at,
  e.updated_at
FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN users u ON e.author_id = u.id;

-- Step 2: Grant permissions on the view
GRANT SELECT ON public.events_with_details TO authenticated, anon;

-- Step 3: Update RLS policies on events table to allow all authenticated users to edit
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to update events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to delete events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to insert events" ON public.events;
DROP POLICY IF EXISTS "Allow public to read events" ON public.events;

-- Create new permissive policies
CREATE POLICY "Allow public to read events"
  ON public.events
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update all events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete all events"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Step 5: Update event_categories RLS to match
DROP POLICY IF EXISTS "Allow public read access" ON public.event_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage" ON public.event_categories;

CREATE POLICY "Allow public to read event_categories"
  ON public.event_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage event_categories"
  ON public.event_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 6: Update event_speakers RLS similarly
DROP POLICY IF EXISTS "Allow public read access on event_speakers" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_select_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_insert_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_update_policy" ON public.event_speakers;
DROP POLICY IF EXISTS "event_speakers_delete_policy" ON public.event_speakers;

CREATE POLICY "Allow public to read event_speakers"
  ON public.event_speakers
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage event_speakers"
  ON public.event_speakers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the fix
SELECT 
  'Events with multiple categories:' AS check_type,
  COUNT(*) AS count
FROM events e
WHERE EXISTS (
  SELECT 1 FROM event_categories ec WHERE ec.event_id = e.id HAVING COUNT(*) > 1
);

