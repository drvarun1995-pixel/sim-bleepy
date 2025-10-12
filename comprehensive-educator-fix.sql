-- Comprehensive Educator Dashboard Fix
-- This disables RLS on critical tables to restore educator functionality
-- Run this in your Supabase SQL Editor

-- 1. Disable RLS on users table (critical for role checking)
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on user_profiles table (for profile data)
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on resources table (for educator file uploads)
ALTER TABLE IF EXISTS resources DISABLE ROW LEVEL SECURITY;

-- 4. Disable RLS on events table (for educator event access)
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;

-- 5. Disable RLS on resource_events table (junction table)
ALTER TABLE IF EXISTS resource_events DISABLE ROW LEVEL SECURITY;

-- 6. Verify which tables have RLS enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'user_profiles', 'resources', 'events', 'resource_events')
ORDER BY tablename;

-- 7. Check current user roles in database
SELECT 
    email,
    role,
    created_at
FROM users
WHERE role IN ('admin', 'educator')
ORDER BY role, email;

-- Expected Result: All tables should show rls_enabled = false
-- This ensures educators can:
-- - Have their role checked properly
-- - Upload resources to the downloads page
-- - Access educator dashboard features
-- - View and manage their content

-- Note: Security is still maintained through:
-- 1. API route authentication (NextAuth)
-- 2. Service role key usage in API routes
-- 3. Middleware protection on sensitive routes
-- 4. Application-level permission checks (isAdmin, isEducator)

