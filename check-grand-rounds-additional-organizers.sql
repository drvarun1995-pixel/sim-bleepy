-- =====================================================
-- CHECK GRAND ROUNDS FOR ADDITIONAL ORGANIZERS
-- =====================================================
-- This will show you exactly which Grand Rounds have additional organizers
-- =====================================================

-- 1. Check Grand Rounds and their organizer counts
SELECT 
    id,
    title,
    date,
    organizer_name as main_organizer,
    json_array_length(organizers::json) as total_organizers,
    json_array_length(other_organizers::json) as additional_organizers,
    CASE 
        WHEN json_array_length(other_organizers::json) > 0 THEN 'YES - Has Additional'
        ELSE 'NO - No Additional'
    END as has_additional_organizers
FROM events_with_details 
WHERE title ILIKE '%grand round%'
ORDER BY date DESC, title;

-- 2. Show detailed organizer breakdown for Grand Rounds
SELECT 
    id,
    title,
    date,
    organizer_name as main_organizer,
    -- Show the full organizers JSON
    organizers,
    -- Show just the additional organizers
    other_organizers,
    -- Count breakdown
    json_array_length(organizers::json) as total_organizers,
    json_array_length(other_organizers::json) as additional_organizers
FROM events_with_details 
WHERE title ILIKE '%grand round%'
ORDER BY date DESC, title;

-- 3. Check the junction table directly for Grand Rounds
SELECT 
    e.id as event_id,
    e.title,
    e.date,
    o.name as organizer_name,
    eo.is_main_organizer,
    eo.created_at as assigned_at
FROM events e
JOIN event_organizers eo ON e.id = eo.event_id
JOIN organizers o ON eo.organizer_id = o.id
WHERE e.title ILIKE '%grand round%'
ORDER BY e.date DESC, e.title, eo.is_main_organizer DESC, o.name;

-- 4. Summary statistics for Grand Rounds
SELECT 
    'Grand Rounds Organizer Summary' as report_type,
    COUNT(*) as total_grand_rounds,
    COUNT(CASE WHEN json_array_length(organizers::json) > 1 THEN 1 END) as events_with_multiple_organizers,
    COUNT(CASE WHEN json_array_length(other_organizers::json) > 0 THEN 1 END) as events_with_additional_organizers,
    COUNT(CASE WHEN json_array_length(organizers::json) = 1 THEN 1 END) as events_with_only_main_organizer
FROM events_with_details 
WHERE title ILIKE '%grand round%';

-- 5. Show which Grand Rounds need additional organizers
SELECT 
    id,
    title,
    date,
    organizer_name as main_organizer,
    'NEEDS ADDITIONAL ORGANIZERS' as status
FROM events_with_details 
WHERE title ILIKE '%grand round%'
AND json_array_length(other_organizers::json) = 0
ORDER BY date DESC, title;


