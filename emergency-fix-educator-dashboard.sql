-- =====================================================
-- EMERGENCY FIX FOR EDUCATOR DASHBOARD
-- =====================================================
-- This should restore educator dashboard access immediately

-- First, let's check what's happening with the users table
-- The issue is likely that educators can't access their own data

-- Add a policy to allow users to read their own profile data
DROP POLICY IF EXISTS "Users can read own profile for dashboard" ON public.users;
CREATE POLICY "Users can read own profile for dashboard" ON public.users 
  FOR SELECT USING (
    auth.uid()::text = id::text OR 
    auth.email() = email OR
    auth.role() = 'service_role'
  );

-- Also ensure authenticated users can read user data for role checking
DROP POLICY IF EXISTS "Authenticated users can check roles" ON public.users;
CREATE POLICY "Authenticated users can check roles" ON public.users 
  FOR SELECT USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );

-- Check current policies on users table
SELECT 'Current users table policies:' as info;
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- Test if we can read users data
SELECT 'Testing user access...' as info;
SELECT COUNT(*) as user_count FROM public.users;
