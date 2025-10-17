-- Debug current RLS status and policies
-- This will help us understand what's blocking the operations

-- 1. Check if RLS is enabled on events table
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'events';

-- 2. Check all policies on events table
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'events'
ORDER BY policyname;

-- 3. Check your current user role
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE email = 'drvarun1995@gmail.com';

-- 4. Check if auth.jwt() is working
SELECT 
    auth.jwt() ->> 'email' as jwt_email,
    auth.uid() as auth_uid,
    auth.role() as auth_role;

-- 5. Test the policy condition manually
SELECT 
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
    ) as policy_condition_result;












