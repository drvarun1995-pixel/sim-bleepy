-- =====================================================
-- HOW TO APPLY THE AUTHENTICATED USER RLS FIX
-- =====================================================
-- 
-- PROBLEM:
-- After enabling RLS, authenticated users cannot create/edit/delete
-- events, organizers, locations, speakers, etc. from the frontend.
-- 
-- ERROR MESSAGE:
-- "new row violates row-level security policy for table 'X'"
--
-- ROOT CAUSE:
-- The previous RLS fix only added service role policies, but the
-- frontend uses client-side Supabase (lib/events-api.ts) which runs
-- as authenticated users, not as service role.
--
-- SOLUTION:
-- Run the migration script to add INSERT/UPDATE/DELETE policies
-- for authenticated users with proper roles.
--
-- =====================================================

-- =====================================================
-- STEP 1: Run the migration script
-- =====================================================
-- 
-- In Supabase SQL Editor, run:
-- migrations/fix-rls-authenticated-user-policies.sql
--
-- This will add policies that allow authenticated users with roles:
-- - admin
-- - educator
-- - meded
-- - ctf
--
-- To perform INSERT/UPDATE/DELETE operations on:
-- - events
-- - categories
-- - formats
-- - locations
-- - organizers
-- - speakers
-- - event_categories (junction table)
-- - event_formats (junction table)
-- - event_locations (junction table)
-- - event_organizers (junction table)
-- - event_speakers (junction table)
-- - resources
--
-- =====================================================

-- =====================================================
-- STEP 2: Verify the fix
-- =====================================================
--
-- Run this query to check that the policies were created:

SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'events', 'categories', 'formats', 'locations', 'organizers', 'speakers',
    'event_categories', 'event_formats', 'event_locations', 'event_organizers', 'event_speakers',
    'resources'
  )
  AND policyname LIKE 'Authenticated users%'
ORDER BY tablename, cmd;

-- Expected: You should see 3 policies per table (INSERT, UPDATE, DELETE)
-- Total: ~36 policies

-- =====================================================
-- STEP 3: Test the fix
-- =====================================================
--
-- 1. Log in as an admin/educator/meded user
-- 2. Go to /event-data page
-- 3. Try to create a new organizer
-- 4. Try to create a new location
-- 5. Try to create a new speaker
-- 6. Try to create a new event
--
-- All operations should now work without RLS errors!
--
-- =====================================================

-- =====================================================
-- SECURITY NOTES
-- =====================================================
--
-- 1. Only users with roles: admin, educator, meded, ctf can manage events
-- 2. Regular students cannot create/edit/delete events
-- 3. Service role policies still exist for API operations
-- 4. This maintains security while allowing proper functionality
--
-- The policies check the user's role from the users table based on
-- the email in the NextAuth JWT token.
--
-- =====================================================

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================
--
-- If you still get RLS errors after applying the fix:
--
-- 1. Check that the user has the correct role:
SELECT id, email, name, role FROM users WHERE email = 'your-email@example.com';
--
-- 2. Check that the policies exist:
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE 'Authenticated users%';
-- Expected: ~36 policies
--
-- 3. Check that RLS is enabled:
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'organizers', 'locations', 'speakers');
-- Expected: All should show 't' (true)
--
-- 4. Check the JWT token contains the email:
-- In browser console, run:
-- console.log(await (await fetch('/api/auth/session')).json())
-- Should show: { user: { email: '...', ... } }
--
-- =====================================================







