-- Fix Educator Dashboard Access Issue
-- This script disables RLS on the users table to allow role checking
-- Run this in your Supabase SQL Editor

-- Disable RLS on users table to allow role checks
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Note: With RLS disabled, access control relies on API routes and service role key
-- The service role key bypasses RLS anyway, but disabling it ensures no conflicts

