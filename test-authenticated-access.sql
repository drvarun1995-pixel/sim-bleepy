-- Test if authenticated users can SELECT after UPDATE
-- This simulates what the browser does

-- First, verify current policies
SELECT 'Current Policies:' as info;
SELECT policyname, cmd, roles, permissive, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'events'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT 'RLS Status:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'events';

-- Try a different approach: Make SELECT policy even more permissive
DROP POLICY IF EXISTS "Allow everyone to read events" ON public.events;

-- Create the most permissive SELECT policy possible
CREATE POLICY "Public read access for events"
  ON public.events
  FOR SELECT
  USING (true);

-- Verify
SELECT 'Updated Policies:' as info;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'events' AND cmd = 'SELECT';

