-- Test script to check if Grand Rounds events have additional organizers
-- This will help verify if the AI bulk upload properly assigned additional organizers

-- 1. First, let's see all Grand Rounds events and their organizer data
SELECT 
    e.id,
    e.title,
    e.date,
    e.organizer_id,
    o.name as main_organizer_name,
    -- Check if there are additional organizers in the junction table
    COUNT(eo.id) as additional_organizer_count,
    -- Get the names of additional organizers
    STRING_AGG(DISTINCT o2.name, ', ') as additional_organizer_names
FROM events e
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN event_organizers eo ON e.id = eo.event_id AND eo.is_main_organizer = false
LEFT JOIN organizers o2 ON eo.organizer_id = o2.id
WHERE e.title ILIKE '%grand round%' OR e.title ILIKE '%grand rounds%'
GROUP BY e.id, e.title, e.date, e.organizer_id, o.name
ORDER BY e.date DESC;

-- 2. Check the events_with_details view for Grand Rounds
SELECT 
    id,
    title,
    date,
    organizer_name,
    other_organizers,
    organizers
FROM events_with_details 
WHERE title ILIKE '%grand round%' OR title ILIKE '%grand rounds%'
ORDER BY date DESC;

-- 3. Count how many Grand Rounds events have additional organizers
SELECT 
    COUNT(*) as total_grand_rounds,
    COUNT(CASE WHEN additional_organizer_count > 0 THEN 1 END) as with_additional_organizers,
    COUNT(CASE WHEN additional_organizer_count = 0 THEN 1 END) as without_additional_organizers
FROM (
    SELECT 
        e.id,
        COUNT(eo.id) as additional_organizer_count
    FROM events e
    LEFT JOIN event_organizers eo ON e.id = eo.event_id AND eo.is_main_organizer = false
    WHERE e.title ILIKE '%grand round%' OR e.title ILIKE '%grand rounds%'
    GROUP BY e.id
) subquery;

-- 4. Show a sample of Grand Rounds events with their full organizer details
SELECT 
    e.id,
    e.title,
    e.date,
    -- Main organizer
    o.name as main_organizer,
    -- Additional organizers from junction table
    STRING_AGG(
        CASE 
            WHEN eo.is_main_organizer = false 
            THEN o2.name 
        END, 
        ', '
    ) as additional_organizers_from_junction,
    -- All organizers from view
    ed.organizers as all_organizers_from_view
FROM events e
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN event_organizers eo ON e.id = eo.event_id
LEFT JOIN organizers o2 ON eo.organizer_id = o2.id
LEFT JOIN events_with_details ed ON e.id = ed.id
WHERE e.title ILIKE '%grand round%' OR e.title ILIKE '%grand rounds%'
GROUP BY e.id, e.title, e.date, o.name
ORDER BY e.date DESC
LIMIT 10;

-- 5. Check if there are any Grand Rounds events with empty other_organizer_ids array
SELECT 
    e.id,
    e.title,
    e.date,
    e.other_organizer_ids,
    CASE 
        WHEN e.other_organizer_ids IS NULL THEN 'NULL'
        WHEN array_length(e.other_organizer_ids, 1) IS NULL THEN 'Empty array'
        ELSE 'Has ' || array_length(e.other_organizer_ids, 1) || ' organizers'
    END as other_organizer_status
FROM events e
WHERE e.title ILIKE '%grand round%' OR e.title ILIKE '%grand rounds%'
ORDER BY e.date DESC;

