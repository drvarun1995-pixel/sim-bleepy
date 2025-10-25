-- =====================================================
-- TEST ADDING ADDITIONAL ORGANIZERS
-- =====================================================
-- This will add some additional organizers to test the system
-- =====================================================

-- Add some additional organizers to a few Grand Rounds
-- Let's add Sarah and Varun as additional organizers to one event
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    o.id as organizer_id,
    FALSE as is_main_organizer
FROM events e
CROSS JOIN organizers o
WHERE e.title ILIKE '%grand round%' 
AND e.title ILIKE '%thursday%'
AND o.name IN ('Sarah', 'Varun')
LIMIT 1;

-- Add Hannah-Maria and Thanuji as additional organizers to another event
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
AND e.id NOT IN (
    SELECT event_id FROM event_organizers 
    WHERE organizer_id = (SELECT id FROM organizers WHERE name = 'Sarah' LIMIT 1)
)
LIMIT 1;

-- Test the updated view
SELECT 
    id,
    title,
    organizer_name,
    json_array_length(organizers::json) as total_organizers,
    json_array_length(other_organizers::json) as additional_organizers,
    organizers,
    other_organizers
FROM events_with_details 
WHERE title ILIKE '%grand round%'
ORDER BY title
LIMIT 5;

-- Show the junction table data
SELECT 
    eo.event_id,
    e.title,
    o.name as organizer_name,
    eo.is_main_organizer,
    eo.created_at
FROM event_organizers eo
JOIN events e ON eo.event_id = e.id
JOIN organizers o ON eo.organizer_id = o.id
WHERE e.title ILIKE '%grand round%'
ORDER BY e.title, eo.is_main_organizer DESC, o.name;


