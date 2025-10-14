-- Fix events with missing author_id by linking them to the correct users
-- Run this in your Supabase SQL Editor

-- First, let's see all events with missing author_id
SELECT 
    id,
    title,
    author_id,
    author_name,
    created_at
FROM public.events 
WHERE author_id IS NULL 
   OR author_id = ''
ORDER BY created_at DESC;

-- Check if there are users that match the author_name
SELECT 
    id,
    email,
    name,
    role
FROM public.users 
WHERE name LIKE '%VT%' 
   OR name LIKE '%NHS%'
   OR email LIKE '%varun%'
ORDER BY created_at DESC;

-- Fix the specific "test" event by linking it to the correct user
-- Based on the debug data, it looks like "VT NHS" should be linked to the user with ID "02c99dc5-..."
-- Let's find the user with name "Dr. Varun" and email "drvarun19!" and link the test event to them

UPDATE public.events 
SET 
    author_id = (
        SELECT id FROM public.users 
        WHERE name = 'Dr. Varun' 
          AND email LIKE '%drvarun19%'
        LIMIT 1
    ),
    author_name = (
        SELECT name FROM public.users 
        WHERE name = 'Dr. Varun' 
          AND email LIKE '%drvarun19%'
        LIMIT 1
    )
WHERE id = 'ca86c4b0-test'
  AND title = 'test'
  AND author_id IS NULL;

-- Verify the fix
SELECT 
    id,
    title,
    author_id,
    author_name,
    created_at
FROM public.events 
WHERE id = 'ca86c4b0-test';

-- Also check the events_with_details view to make sure it shows correctly
SELECT 
    id,
    title,
    author_id,
    author_name,
    author_email
FROM public.events_with_details
WHERE id = 'ca86c4b0-test';

-- General fix for any other events with missing author_id
-- This will link events to users based on matching author_name
UPDATE public.events 
SET 
    author_id = (
        SELECT id FROM public.users 
        WHERE users.name = events.author_name
        LIMIT 1
    )
WHERE author_id IS NULL 
  AND author_name IS NOT NULL 
  AND author_name != 'Unknown User'
  AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.name = events.author_name
  );

-- Final verification - show all events and their author status
SELECT 
    e.id,
    e.title,
    e.author_id,
    e.author_name,
    CASE 
        WHEN e.author_id IS NULL THEN 'MISSING AUTHOR_ID'
        WHEN u.id IS NULL THEN 'USER NOT FOUND'
        ELSE 'OK'
    END as status,
    u.name as user_name,
    u.email as user_email
FROM public.events e
LEFT JOIN public.users u ON e.author_id = u.id
ORDER BY e.created_at DESC
LIMIT 10;

SELECT 'Author ID fixes applied!' as status;

