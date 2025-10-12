-- Verification Script for Educator Dashboard Access
-- Run this AFTER applying comprehensive-educator-fix.sql
-- This will confirm everything is working correctly

-- 1. Check RLS status on critical tables
SELECT 
    'RLS Status Check' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity = false THEN '✓ DISABLED (Good)'
        WHEN rowsecurity = true THEN '✗ ENABLED (Problem)'
        ELSE '? UNKNOWN'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'user_profiles', 'resources', 'events', 'resource_events', 'contact_messages')
ORDER BY tablename;

-- 2. List all educators in the system
SELECT 
    'Educators in System' as check_type,
    email,
    name,
    role,
    created_at
FROM users
WHERE role = 'educator'
ORDER BY email;

-- 3. Count resources by role
SELECT 
    'Resource Upload Stats' as check_type,
    u.role,
    COUNT(r.id) as resource_count
FROM users u
LEFT JOIN resources r ON r.uploaded_by_email = u.email
WHERE u.role IN ('admin', 'educator')
GROUP BY u.role
ORDER BY u.role;

-- 4. Check for any RLS policies that might still be active
SELECT 
    'Active RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'user_profiles', 'resources', 'events', 'resource_events')
ORDER BY tablename, policyname;

-- Expected Results:
-- 1. RLS Status: All tables should show "✓ DISABLED (Good)"
-- 2. Educators: Should list all educator accounts
-- 3. Resource Stats: Should show resources uploaded by educators
-- 4. RLS Policies: Should be empty or show only non-blocking policies

-- If any table shows RLS ENABLED, run:
-- ALTER TABLE [table_name] DISABLE ROW LEVEL SECURITY;

