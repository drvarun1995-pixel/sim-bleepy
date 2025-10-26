-- Debug script to check announcements table and data
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if announcements table exists and has data
SELECT 
    'Table Check' as check_type,
    COUNT(*) as count,
    'announcements' as table_name
FROM public.announcements;

-- 2. Check the specific announcement that's failing
SELECT 
    'Specific Announcement' as check_type,
    id,
    title,
    author_id,
    is_active,
    created_at,
    updated_at
FROM public.announcements 
WHERE id = 'ef1b45d3-2ec3-4d8a-b13e-531d8a795982';

-- 3. Check all announcements with their author info
SELECT 
    'All Announcements' as check_type,
    a.id,
    a.title,
    a.author_id,
    u.name as author_name,
    u.email as author_email,
    a.is_active,
    a.created_at
FROM public.announcements a
LEFT JOIN public.users u ON a.author_id = u.id
ORDER BY a.created_at DESC;

-- 4. Check if the foreign key relationship is working
SELECT 
    'Foreign Key Check' as check_type,
    COUNT(*) as user_count,
    'users' as table_name
FROM public.users;

-- 5. Check RLS policies on announcements table
SELECT 
    'RLS Policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'announcements';

-- 6. Test a simple update query (this will help identify the issue)
UPDATE public.announcements 
SET updated_at = NOW() 
WHERE id = 'ef1b45d3-2ec3-4d8a-b13e-531d8a795982'
RETURNING id, title, updated_at;
