-- =====================================================
-- STEP 6: VERIFY AND FIX USERS TABLE RLS
-- =====================================================

-- Ensure users table has RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can read all users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- Create comprehensive policies for users table
-- Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage all users" ON public.users 
  FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own data
CREATE POLICY "Users can view their own data" ON public.users 
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update their own data" ON public.users 
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can insert their own data (for registration)
CREATE POLICY "Users can insert their own data" ON public.users 
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Verify
SELECT 'Users table RLS policies updated' as status;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users';
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users';
