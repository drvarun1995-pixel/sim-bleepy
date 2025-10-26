-- ============================================================================
-- MAP EXISTING RESOURCES FROM STORAGE BUCKET TO DATABASE
-- ============================================================================
-- This script helps you map existing files from your Supabase storage bucket
-- to the resources database table

-- ============================================================================
-- STEP 1: DISCOVER EXISTING FILES IN STORAGE
-- ============================================================================

-- First, let's see what files exist in your storage bucket
-- You'll need to run this in Supabase SQL Editor to see the structure

-- Check if storage.objects table exists and what files are there
SELECT 
    'Storage files discovery' as info,
    COUNT(*) as total_files
FROM storage.objects 
WHERE bucket_id = 'resources';

-- Show the folder structure
SELECT 
    bucket_id,
    name,
    path_tokens,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'resources'
ORDER BY name;

-- ============================================================================
-- STEP 2: TEMPLATE FOR MAPPING FILES
-- ============================================================================

-- For each file you find in storage, you'll need to create a database entry
-- Use this template and customize it for each file:

/*
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
    'Your File Title',                    -- title: Give it a descriptive name
    'Description of the file',            -- description: What is this file about?
    'bedside-teaching',                   -- category: Choose from supported categories
    'filename.pdf',                       -- file_name: The actual filename
    'bedside-teaching/filename.pdf',      -- file_path: Full path in storage bucket
    'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/bedside-teaching/filename.pdf', -- file_url: Public URL
    1024000,                              -- file_size: Size in bytes (you'll need to check this)
    'application/pdf',                    -- file_type: MIME type based on file extension
    'Your Name',                          -- uploaded_by_name: Who uploaded it originally
    true                                  -- is_active: Set to true to make it visible
);
*/

-- ============================================================================
-- STEP 3: HELPER QUERIES TO GET FILE INFORMATION
-- ============================================================================

-- Get file size and metadata from storage
SELECT 
    name,
    metadata->>'size' as file_size_bytes,
    metadata->>'mimetype' as mime_type,
    created_at,
    updated_at
FROM storage.objects 
WHERE bucket_id = 'resources'
ORDER BY name;

-- ============================================================================
-- STEP 4: BULK MAPPING SCRIPT TEMPLATE
-- ============================================================================

-- If you have many files, you can use this template to create multiple entries at once
-- Just replace the values in the VALUES section for each file

/*
INSERT INTO public.resources (
    title, description, category, file_name, file_path, file_url, file_size, file_type, uploaded_by_name, is_active
) VALUES 
    -- File 1
    ('Grand Rounds Presentation', 'Weekly grand rounds presentation slides', 'grand-round', 'grand-rounds-2024-01.pdf', 'grand-round/grand-rounds-2024-01.pdf', 'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/grand-round/grand-rounds-2024-01.pdf', 2048000, 'application/pdf', 'Dr. Smith', true),
    
    -- File 2
    ('Clinical Skills Guide', 'Step-by-step clinical skills guide', 'clinical-skills', 'clinical-skills-guide.pdf', 'clinical-skills/clinical-skills-guide.pdf', 'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/clinical-skills/clinical-skills-guide.pdf', 1536000, 'application/pdf', 'Dr. Johnson', true),
    
    -- File 3
    ('Bedside Teaching Video', 'Video recording of bedside teaching session', 'bedside-teaching', 'bedside-teaching-video.mp4', 'bedside-teaching/bedside-teaching-video.mp4', 'https://your-supabase-url.supabase.co/storage/v1/object/public/resources/bedside-teaching/bedside-teaching-video.mp4', 52428800, 'video/mp4', 'Dr. Williams', true)
    
    -- Add more files as needed...
;
*/

-- ============================================================================
-- STEP 5: LINK RESOURCES TO EVENTS (OPTIONAL)
-- ============================================================================

-- After creating resource entries, you can link them to specific events
-- First, find the resource ID and event ID, then create the link

/*
-- Example: Link a resource to an event
INSERT INTO public.resource_events (resource_id, event_id) 
VALUES (
    (SELECT id FROM public.resources WHERE file_name = 'grand-rounds-2024-01.pdf'),
    (SELECT id FROM public.events WHERE title LIKE '%Grand Round%' AND date = '2024-01-15')
);
*/

-- ============================================================================
-- STEP 6: VERIFICATION QUERIES
-- ============================================================================

-- After mapping, verify your resources are properly set up
SELECT 
    'Mapped resources count' as info,
    COUNT(*) as count
FROM public.resources;

-- Show all mapped resources
SELECT 
    id,
    title,
    category,
    file_name,
    file_path,
    uploaded_by_name,
    created_at,
    is_active
FROM public.resources
ORDER BY created_at DESC;

-- Check for any resources without proper file paths
SELECT 
    'Resources with missing file paths' as info,
    COUNT(*) as count
FROM public.resources
WHERE file_path IS NULL OR file_path = '';

-- ============================================================================
-- STEP 7: COMMON FILE TYPE MAPPINGS
-- ============================================================================

-- Here are common file extensions and their MIME types for reference:

/*
PDF files:     application/pdf
Word docs:     application/vnd.openxmlformats-officedocument.wordprocessingml.document
Excel files:   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
PowerPoint:    application/vnd.openxmlformats-officedocument.presentationml.presentation
Images:        image/jpeg, image/png, image/gif
Videos:        video/mp4, video/avi, video/mov
Audio:         audio/mp3, audio/wav
Text files:    text/plain
ZIP files:     application/zip
*/

-- ============================================================================
-- STEP 8: CATEGORY MAPPING GUIDE
-- ============================================================================

-- Map your files to the correct categories based on their content:

/*
bedside-teaching          - Bedside teaching materials
clinical-skills           - Clinical skills guides and resources
core-teachings           - Core teaching materials
exams-mocks              - Exam preparation and mock tests
grand-round              - Grand rounds presentations
hub-days                 - Hub day materials
inductions               - Induction and orientation materials
obs-gynae-practice-sessions - Obstetrics and gynecology practice
osce-revision            - OSCE revision materials
others                   - Miscellaneous files
paeds-practice-sessions  - Pediatrics practice materials
pharmacy-teaching        - Pharmacy teaching resources
portfolio-drop-ins       - Portfolio and drop-in session materials
twilight-teaching        - Twilight teaching sessions
video-teaching           - Video-based teaching materials
*/

-- ============================================================================
-- INSTRUCTIONS FOR USE
-- ============================================================================

/*
TO USE THIS SCRIPT:

1. First, run the discovery queries (Step 1) to see what files you have
2. Note down the file names, paths, and sizes
3. Use the template in Step 2 to create database entries for each file
4. Customize the title, description, and category for each file
5. Run the verification queries (Step 6) to make sure everything is mapped correctly
6. Optionally link resources to events using Step 5

IMPORTANT NOTES:
- Make sure the file_path in the database matches exactly with the path in storage
- Use the correct MIME type for each file
- Set is_active = true to make files visible to users
- Choose appropriate categories based on the file content
- The uploaded_by_name should be the person who originally uploaded the file
*/
