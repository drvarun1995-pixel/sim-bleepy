-- Debug script to investigate the "Unknown User" issue
-- Run this in your Supabase SQL Editor

-- 1. Check the structure of the events table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events'
ORDER BY ordinal_position;

-- 2. Check the structure of the users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check if there are any events with author_id but no corresponding user
SELECT 
    e.id,
    e.title,
    e.author_id,
    e.author_name,
    CASE 
        WHEN u.id IS NULL THEN 'NO USER FOUND'
        ELSE 'USER FOUND'
    END as user_status,
    u.name as user_name,
    u.email as user_email
FROM public.events e
LEFT JOIN public.users u ON e.author_id = u.id
WHERE e.author_id IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 10;

-- 4. Check events with "Unknown User" or missing author information
SELECT 
    e.id,
    e.title,
    e.author_id,
    e.author_name,
    e.created_at
FROM public.events e
WHERE e.author_id IS NULL 
   OR e.author_name IS NULL 
   OR e.author_name = 'Unknown User'
ORDER BY e.created_at DESC
LIMIT 10;

-- 5. Check the events_with_details view directly
SELECT 
    id,
    title,
    author_id,
    author_name,
    author_email
FROM public.events_with_details
WHERE author_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check if there are any RLS policies blocking access to users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- 7. Check if the events table has RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('events', 'users');

-- 8. Test a simple query to see if we can access user data
SELECT 
    u.id,
    u.email,
    u.name,
    u.role
FROM public.users u
LIMIT 5;

-- 9. Check if there are any MedEd Team users
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM public.users 
WHERE role = 'meded_team' 
   OR email LIKE '%@ctf%'
   OR email LIKE '%@meded%'
ORDER BY created_at DESC;

-- 10. Check the most recent events and their authors
SELECT 
    e.id,
    e.title,
    e.author_id,
    e.author_name,
    e.created_at,
    u.name as actual_user_name,
    u.email as actual_user_email,
    u.role as actual_user_role
FROM public.events e
LEFT JOIN public.users u ON e.author_id = u.id
ORDER BY e.created_at DESC
LIMIT 10;

