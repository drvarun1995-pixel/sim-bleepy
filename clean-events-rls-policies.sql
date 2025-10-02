-- CLEAN UP EVENTS RLS POLICIES
-- Remove all old conflicting policies and keep only the new permissive ones

-- Drop ALL old policies
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;

-- Drop the new ones too (they already exist but let's recreate to be sure)
DROP POLICY IF EXISTS "Allow authenticated users to delete all events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to insert events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated users to update all events" ON public.events;
DROP POLICY IF EXISTS "Allow public to read events" ON public.events;

-- Create clean, simple policies
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

-- Verify the policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'events'
ORDER BY cmd, policyname;

