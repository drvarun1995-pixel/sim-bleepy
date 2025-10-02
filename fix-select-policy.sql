-- FIX SELECT POLICY FOR AUTHENTICATED USERS
-- The issue is that authenticated users need explicit SELECT permission

-- Drop the existing public-only SELECT policy
DROP POLICY IF EXISTS "Allow public to read events" ON public.events;

-- Create a new SELECT policy that works for BOTH public and authenticated users
CREATE POLICY "Allow everyone to read events"
  ON public.events
  FOR SELECT
  TO public, authenticated
  USING (true);

-- Verify the fix
SELECT policyname, cmd, roles, permissive
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'events'
ORDER BY cmd, policyname;

