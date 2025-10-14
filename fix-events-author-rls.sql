-- Fix RLS policies to allow events to access user data for author information
-- Run this in your Supabase SQL Editor

-- First, let's check the current RLS policies on the users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- Check if there are any policies that might block access to user data for events
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'events'
ORDER BY policyname;

-- Create a policy to allow reading user data for event author information
-- This policy allows the events_with_details view to access user data
CREATE POLICY "Allow reading user data for events" ON public.users
  FOR SELECT 
  USING (
    -- Allow access if the user is being referenced as an author in events
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.author_id = users.id
    )
    OR
    -- Allow access if the current user is authenticated (for their own data)
    auth.uid()::text = users.id::text
    OR
    -- Allow access for admin users (if they have a role field)
    EXISTS (
      SELECT 1 FROM public.users admin_user
      WHERE admin_user.id = auth.uid()::text
      AND admin_user.role IN ('admin', 'meded_team', 'educator')
    )
  );

-- Also ensure the events_with_details view has proper permissions
-- Grant SELECT permission on the view to authenticated users
GRANT SELECT ON public.events_with_details TO authenticated, anon;

-- Let's also check if the users table has a role column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- If the role column doesn't exist, add it
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Update existing users to have appropriate roles if they don't have one
UPDATE public.users 
SET role = 'meded_team' 
WHERE role IS NULL OR role = 'user'
AND email IN (
  SELECT email FROM public.users 
  WHERE email LIKE '%@ctf%' 
     OR email LIKE '%@meded%'
     OR email LIKE '%@education%'
);

-- Create an index on the role column for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Verify the fix by checking a sample event with author information
SELECT 
    e.id,
    e.title,
    e.author_id,
    e.author_name,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role
FROM public.events_with_details e
LEFT JOIN public.users u ON e.author_id = u.id
LIMIT 5;

-- Summary
SELECT 'RLS policies updated for events author access!' as status;

