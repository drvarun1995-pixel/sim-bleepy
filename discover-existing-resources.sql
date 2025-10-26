-- This script helps discover existing files in Supabase storage
-- and provides a template for mapping them to the resources table

-- First, let's check if there are any existing resources in the database
SELECT 
    'Existing resources in database:' as info,
    COUNT(*) as count
FROM public.resources;

-- Check the structure of the resources table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'resources' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Template for inserting existing files from storage
-- You'll need to run this for each file you want to map from storage

/*
-- Example template for mapping existing files:
INSERT INTO public.resources (
    title,
    description,
    category,
    file_name,
    file_path,
    file_url,
    file_size,
    file_type,
    uploaded_by_name,
    is_active
) VALUES (
    'Your File Title',                    -- title
    'Description of the file',            -- description
    'bedside-teaching',                   -- category (choose from: bedside-teaching, clinical-skills, core-teachings, exams-mocks, grand-round, hub-days, inductions, obs-gynae-practice-sessions, osce-revision, others, paeds-practice-sessions, pharmacy-teaching, portfolio-drop-ins, twilight-teaching, video-teaching)
    'filename.pdf',                       -- file_name
    'bedside-teaching/filename.pdf',      -- file_path (path in storage bucket)
    'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/bedside-teaching/filename.pdf', -- file_url
    1024000,                              -- file_size (in bytes)
    'application/pdf',                    -- file_type (MIME type)
    'Your Name',                          -- uploaded_by_name
    true                                  -- is_active
);

-- After inserting, you can link to events if needed:
INSERT INTO public.resource_events (resource_id, event_id) 
VALUES (
    (SELECT id FROM public.resources WHERE file_name = 'filename.pdf'),
    'event-uuid-here'
);
*/

-- Check available categories from the format mapping
SELECT 
    'Available categories for resources:' as info,
    unnest(ARRAY[
        'bedside-teaching',
        'clinical-skills', 
        'core-teachings',
        'exams-mocks',
        'grand-round',
        'hub-days',
        'inductions',
        'obs-gynae-practice-sessions',
        'osce-revision',
        'others',
        'paeds-practice-sessions',
        'pharmacy-teaching',
        'portfolio-drop-ins',
        'twilight-teaching',
        'video-teaching'
    ]) as category;

-- Check if there are any events we can link resources to
SELECT 
    'Available events for linking:' as info,
    COUNT(*) as event_count
FROM public.events 
WHERE status = 'published';

-- Show some sample events for reference
SELECT 
    id,
    title,
    date,
    start_time,
    location_name
FROM public.events 
WHERE status = 'published'
ORDER BY date DESC
LIMIT 10;
