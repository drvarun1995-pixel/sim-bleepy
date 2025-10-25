-- Check Grand Rounds events and their organizers
-- This query will show you what's currently in your database

-- First, let's see what columns actually exist in the events table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name LIKE '%organizer%'
ORDER BY column_name;

-- Now let's see all events with "Grand Round" in the title
-- Note: We'll check the main organizer fields first since event_organizers junction table may not exist yet
SELECT 
    e.id,
    e.title,
    e.date,
    e.start_time,
    e.end_time,
    -- Main organizer info from events table
    e.organizer_id,
    -- Additional organizers from other_organizer_ids array (if it exists)
    e.other_organizer_ids,
    -- Count of additional organizers
    CASE 
        WHEN e.other_organizer_ids IS NOT NULL 
        THEN array_length(e.other_organizer_ids, 1) 
        ELSE 0 
    END as additional_organizer_count
FROM events e
WHERE e.title ILIKE '%grand round%'
ORDER BY e.date DESC, e.title;

-- Alternative query to see the raw data structure
-- This shows the actual organizer IDs and names for each event
SELECT 
    e.id,
    e.title,
    e.date,
    e.organizer_id,
    e.other_organizer_ids,
    -- Try to get organizer names for the main organizer
    o_main.name as main_organizer_name,
    -- Try to get organizer names for additional organizers
    array_agg(DISTINCT o_other.name ORDER BY o_other.name) as additional_organizer_names
FROM events e
LEFT JOIN organizers o_main ON e.organizer_id = o_main.id
LEFT JOIN organizers o_other ON o_other.id = ANY(e.other_organizer_ids)
WHERE e.title ILIKE '%grand round%'
GROUP BY e.id, e.title, e.date, e.organizer_id, e.other_organizer_ids, o_main.name
ORDER BY e.date DESC, e.title;

-- Check if there are any events with organizers at all
SELECT 
    COUNT(*) as total_events,
    COUNT(CASE WHEN organizer_id IS NOT NULL THEN 1 END) as events_with_main_organizer,
    COUNT(CASE WHEN other_organizer_ids IS NOT NULL AND array_length(other_organizer_ids, 1) > 0 THEN 1 END) as events_with_additional_organizers
FROM events e
WHERE e.title ILIKE '%grand round%';

-- Check all organizers in the database
SELECT 
    id,
    name,
    created_at
FROM organizers
ORDER BY name;

-- Check if event_organizers junction table exists and has data
-- This will show an error if the table doesn't exist, which is expected
SELECT 
    'event_organizers table does not exist yet' as status
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'event_organizers'
);

-- If the table exists, show its structure
SELECT 
    'event_organizers table exists' as status,
    COUNT(*) as total_records
FROM event_organizers
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'event_organizers'
);
