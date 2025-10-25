-- =====================================================
-- ADD ADDITIONAL ORGANIZERS TO GRAND ROUNDS
-- =====================================================
-- This script will add some additional organizers to your Grand Rounds events
-- =====================================================

-- First, let's see what organizers are available
SELECT 
    id,
    name,
    created_at
FROM organizers 
ORDER BY name
LIMIT 10;

-- Now let's add some additional organizers to Grand Rounds
-- We'll add a few organizers to make the additional organizers feature work

-- Get some organizer IDs to use as additional organizers
-- Let's use a few different organizers for variety
UPDATE events 
SET other_organizer_ids = ARRAY[
    (SELECT id FROM organizers WHERE name = 'Sarah' LIMIT 1),
    (SELECT id FROM organizers WHERE name = 'Varun' LIMIT 1)
]
WHERE title ILIKE '%grand round%' 
AND title ILIKE '%tuesday%'
AND other_organizer_ids IS NULL OR array_length(other_organizer_ids, 1) = 0;

-- Add different organizers to Thursday Grand Rounds
UPDATE events 
SET other_organizer_ids = ARRAY[
    (SELECT id FROM organizers WHERE name = 'Hannah-Maria' LIMIT 1),
    (SELECT id FROM organizers WHERE name = 'Thanuji' LIMIT 1),
    (SELECT id FROM organizers WHERE name = 'Simran' LIMIT 1)
]
WHERE title ILIKE '%grand round%' 
AND title ILIKE '%thursday%'
AND other_organizer_ids IS NULL OR array_length(other_organizer_ids, 1) = 0;

-- Add organizers to any remaining Grand Rounds
UPDATE events 
SET other_organizer_ids = ARRAY[
    (SELECT id FROM organizers WHERE name = 'Megan' LIMIT 1),
    (SELECT id FROM organizers WHERE name = 'Fatema' LIMIT 1)
]
WHERE title ILIKE '%grand round%' 
AND (other_organizer_ids IS NULL OR array_length(other_organizer_ids, 1) = 0);

-- Verify the updates worked
SELECT 
    id,
    title,
    organizer_id,
    other_organizer_ids,
    array_length(other_organizer_ids, 1) as additional_organizer_count
FROM events 
WHERE title ILIKE '%grand round%'
ORDER BY title;

-- Test the events_with_details view to see if it now shows additional organizers
SELECT 
    id,
    title,
    organizer_name,
    other_organizers,
    organizers
FROM events_with_details 
WHERE title ILIKE '%grand round%'
ORDER BY title;


