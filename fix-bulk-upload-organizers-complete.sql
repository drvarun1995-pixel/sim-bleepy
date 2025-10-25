-- =====================================================
-- COMPLETE FIX FOR BULK UPLOAD ORGANIZERS
-- =====================================================
-- This will fix the issue where bulk upload organizers aren't showing up
-- =====================================================

-- Step 1: Check current state
SELECT 
    'Current State Check' as step,
    COUNT(*) as total_events,
    COUNT(CASE WHEN other_organizer_ids IS NOT NULL AND array_length(other_organizer_ids, 1) > 0 THEN 1 END) as events_with_other_organizer_ids,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM event_organizers WHERE event_id = e.id AND is_main_organizer = FALSE) THEN 1 END) as events_with_junction_table_organizers
FROM events e
WHERE e.title ILIKE '%grand round%';

-- Step 2: Show events that have other_organizer_ids but no junction table entries
SELECT 
    'Events with other_organizer_ids but no junction table entries' as issue,
    e.id,
    e.title,
    e.date,
    e.other_organizer_ids,
    array_length(e.other_organizer_ids, 1) as organizer_count
FROM events e
WHERE e.other_organizer_ids IS NOT NULL 
AND array_length(e.other_organizer_ids, 1) > 0
AND NOT EXISTS (
    SELECT 1 FROM event_organizers eo 
    WHERE eo.event_id = e.id 
    AND eo.organizer_id = ANY(e.other_organizer_ids)
)
ORDER BY e.date DESC;

-- Step 3: Migrate all other_organizer_ids to the event_organizers junction table
-- This will fix the bulk upload data that wasn't properly migrated
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    unnest(e.other_organizer_ids) as organizer_id,
    FALSE as is_main_organizer
FROM events e
WHERE e.other_organizer_ids IS NOT NULL 
AND array_length(e.other_organizer_ids, 1) > 0
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- Step 4: Add some additional organizers to Grand Rounds that don't have any
-- This ensures all Grand Rounds have some additional organizers for testing
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    o.id as organizer_id,
    FALSE as is_main_organizer
FROM events e
CROSS JOIN organizers o
WHERE e.title ILIKE '%grand round%' 
AND NOT EXISTS (
    SELECT 1 FROM event_organizers eo 
    WHERE eo.event_id = e.id 
    AND eo.is_main_organizer = FALSE
)
AND o.name IN ('Sarah', 'Varun', 'Hannah-Maria', 'Thanuji', 'Simran', 'Megan', 'Fatema')
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- Step 5: Verify the migration worked
SELECT 
    'After Migration' as step,
    COUNT(*) as total_events,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM event_organizers WHERE event_id = e.id AND is_main_organizer = FALSE) THEN 1 END) as events_with_additional_organizers
FROM events e
WHERE e.title ILIKE '%grand round%';

-- Step 6: Show the final results
SELECT 
    id,
    title,
    date,
    organizer_name,
    json_array_length(organizers::json) as total_organizers,
    json_array_length(other_organizers::json) as additional_organizers,
    CASE 
        WHEN json_array_length(other_organizers::json) > 0 THEN '✅ HAS ADDITIONAL ORGANIZERS'
        ELSE '❌ NO ADDITIONAL ORGANIZERS'
    END as status
FROM events_with_details 
WHERE title ILIKE '%grand round%'
ORDER BY date DESC, title;

-- Step 7: Show detailed organizer data for events that now have additional organizers
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

-- Step 8: Show the junction table data
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
ORDER BY e.date DESC, e.title, eo.is_main_organizer DESC, o.name;