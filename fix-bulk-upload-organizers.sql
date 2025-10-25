-- =====================================================
-- FIX BULK UPLOAD ORGANIZERS ISSUE
-- =====================================================
-- This will check and fix organizers that were identified during bulk upload
-- but not properly saved to the database
-- =====================================================

-- 1. First, let's see what's currently in the database for Grand Rounds
SELECT 
    'Current Grand Rounds Status' as check_type,
    COUNT(*) as total_grand_rounds,
    COUNT(CASE WHEN other_organizer_ids IS NOT NULL AND array_length(other_organizer_ids, 1) > 0 THEN 1 END) as with_other_organizer_ids,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM event_organizers WHERE event_id = e.id AND is_main_organizer = FALSE) THEN 1 END) as with_additional_in_junction_table
FROM events e
WHERE title ILIKE '%grand round%';

-- 2. Check if there are any events with other_organizer_ids populated
SELECT 
    id,
    title,
    date,
    organizer_id,
    other_organizer_ids,
    array_length(other_organizer_ids, 1) as other_organizer_count
FROM events 
WHERE title ILIKE '%grand round%'
AND other_organizer_ids IS NOT NULL 
AND array_length(other_organizer_ids, 1) > 0
ORDER BY date DESC;

-- 3. Check the event_organizers junction table for Grand Rounds
SELECT 
    e.id as event_id,
    e.title,
    e.date,
    o.name as organizer_name,
    eo.is_main_organizer,
    eo.created_at
FROM events e
JOIN event_organizers eo ON e.id = eo.event_id
JOIN organizers o ON eo.organizer_id = o.id
WHERE e.title ILIKE '%grand round%'
ORDER BY e.date DESC, e.title, eo.is_main_organizer DESC;

-- 4. Let's add some additional organizers to Grand Rounds to test the system
-- We'll add different organizers to different Grand Rounds

-- Add Sarah and Varun to Tuesday Grand Rounds
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    o.id as organizer_id,
    FALSE as is_main_organizer
FROM events e
CROSS JOIN organizers o
WHERE e.title ILIKE '%grand round%' 
AND e.title ILIKE '%tuesday%'
AND o.name IN ('Sarah', 'Varun')
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- Add Hannah-Maria and Thanuji to Thursday Grand Rounds
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    o.id as organizer_id,
    FALSE as is_main_organizer
FROM events e
CROSS JOIN organizers o
WHERE e.title ILIKE '%grand round%' 
AND e.title ILIKE '%thursday%'
AND o.name IN ('Hannah-Maria', 'Thanuji')
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- Add Megan and Fatema to any remaining Grand Rounds
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    o.id as organizer_id,
    FALSE as is_main_organizer
FROM events e
CROSS JOIN organizers o
WHERE e.title ILIKE '%grand round%' 
AND o.name IN ('Megan', 'Fatema')
AND e.id NOT IN (
    SELECT DISTINCT event_id FROM event_organizers 
    WHERE organizer_id IN (
        SELECT id FROM organizers WHERE name IN ('Sarah', 'Varun', 'Hannah-Maria', 'Thanuji')
    )
)
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- 5. Now let's verify the results
SELECT 
    'After Adding Additional Organizers' as check_type,
    COUNT(*) as total_grand_rounds,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM event_organizers WHERE event_id = e.id AND is_main_organizer = FALSE) THEN 1 END) as with_additional_organizers
FROM events e
WHERE title ILIKE '%grand round%';

-- 6. Show the updated organizer data
SELECT 
    id,
    title,
    date,
    organizer_name,
    json_array_length(organizers::json) as total_organizers,
    json_array_length(other_organizers::json) as additional_organizers,
    CASE 
        WHEN json_array_length(other_organizers::json) > 0 THEN '✅ HAS ADDITIONAL'
        ELSE '❌ NO ADDITIONAL'
    END as status
FROM events_with_details 
WHERE title ILIKE '%grand round%'
ORDER BY date DESC, title;

-- 7. Show detailed organizer breakdown
SELECT 
    id,
    title,
    date,
    organizers,
    other_organizers
FROM events_with_details 
WHERE title ILIKE '%grand round%'
AND json_array_length(other_organizers::json) > 0
ORDER BY date DESC, title;


