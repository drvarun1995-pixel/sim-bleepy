-- Test script to verify resources table and API are working
-- Run this in Supabase SQL Editor to debug

-- 1. Check if resources table exists and has data
SELECT 
    'Resources table check' as test,
    COUNT(*) as total_resources,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_resources
FROM public.resources;

-- 2. Show all resources
SELECT 
    id,
    title,
    category,
    file_name,
    file_path,
    is_active,
    created_at,
    uploaded_by_name
FROM public.resources
ORDER BY created_at DESC;

-- 3. Check if resource_events table exists
SELECT 
    'Resource events table check' as test,
    COUNT(*) as total_links
FROM public.resource_events;

-- 4. Test the exact query the API uses
SELECT *
FROM public.resources
WHERE is_active = true
ORDER BY created_at DESC;

-- 5. Check RLS policies are working
-- This should work if you're authenticated
SELECT 
    'RLS test' as test,
    COUNT(*) as accessible_resources
FROM public.resources;
