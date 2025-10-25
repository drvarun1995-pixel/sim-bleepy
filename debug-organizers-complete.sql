-- =====================================================
-- COMPLETE DEBUG SCRIPT FOR ORGANIZERS
-- =====================================================
-- This will help us understand what's happening with organizers
-- =====================================================

-- 1. Check if the events_with_details view exists and works
SELECT 
    'events_with_details view check' as test_name,
    COUNT(*) as total_events,
    COUNT(CASE WHEN organizer_name IS NOT NULL THEN 1 END) as events_with_main_organizer,
    COUNT(CASE WHEN other_organizers IS NOT NULL THEN 1 END) as events_with_additional_organizers,
    COUNT(CASE WHEN organizers IS NOT NULL THEN 1 END) as events_with_combined_organizers
FROM events_with_details;

-- 2. Check specific Grand Round events and their organizer data
SELECT 
    id,
    title,
    date,
    organizer_name,
    other_organizer_ids,
    other_organizers,
    organizers
FROM events_with_details 
WHERE title ILIKE '%grand round%'
ORDER BY date DESC
LIMIT 5;

-- 3. Check if other_organizer_ids array has data
SELECT 
    id,
    title,
    other_organizer_ids,
    array_length(other_organizer_ids, 1) as organizer_count
FROM events 
WHERE title ILIKE '%grand round%' 
AND other_organizer_ids IS NOT NULL 
AND array_length(other_organizer_ids, 1) > 0
ORDER BY date DESC
LIMIT 5;

-- 4. Check if organizers exist in the organizers table
SELECT 
    id,
    name,
    created_at
FROM organizers 
ORDER BY name
LIMIT 10;

-- 5. Check the raw events table structure for organizer fields
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name LIKE '%organizer%'
ORDER BY column_name;

-- 6. Sample event with all organizer data
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    e.other_organizer_ids,
    o_main.name as main_organizer_name,
    array_agg(o_other.name ORDER BY o_other.name) as additional_organizer_names
FROM events e
LEFT JOIN organizers o_main ON e.organizer_id = o_main.id
LEFT JOIN organizers o_other ON o_other.id = ANY(e.other_organizer_ids)
WHERE e.title ILIKE '%grand round%'
GROUP BY e.id, e.title, e.organizer_id, e.other_organizer_ids, o_main.name
ORDER BY e.date DESC
LIMIT 3;


