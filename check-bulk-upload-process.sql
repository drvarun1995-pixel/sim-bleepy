-- =====================================================
-- CHECK BULK UPLOAD PROCESS FOR ORGANIZERS
-- =====================================================
-- This will help us understand what should happen during bulk upload
-- =====================================================

-- 1. Check if there are any events with other_organizer_ids that weren't migrated
SELECT 
    'Events with other_organizer_ids not in junction table' as issue_type,
    COUNT(*) as count
FROM events e
WHERE e.other_organizer_ids IS NOT NULL 
AND array_length(e.other_organizer_ids, 1) > 0
AND NOT EXISTS (
    SELECT 1 FROM event_organizers eo 
    WHERE eo.event_id = e.id 
    AND eo.organizer_id = ANY(e.other_organizer_ids)
);

-- 2. Show specific events that have other_organizer_ids but no junction table entries
SELECT 
    e.id,
    e.title,
    e.date,
    e.other_organizer_ids,
    array_length(e.other_organizer_ids, 1) as organizer_count,
    'MISSING FROM JUNCTION TABLE' as status
FROM events e
WHERE e.other_organizer_ids IS NOT NULL 
AND array_length(e.other_organizer_ids, 1) > 0
AND NOT EXISTS (
    SELECT 1 FROM event_organizers eo 
    WHERE eo.event_id = e.id 
    AND eo.organizer_id = ANY(e.other_organizer_ids)
)
ORDER BY e.date DESC;

-- 3. Migrate any remaining other_organizer_ids to the junction table
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    unnest(e.other_organizer_ids) as organizer_id,
    FALSE as is_main_organizer
FROM events e
WHERE e.other_organizer_ids IS NOT NULL 
AND array_length(e.other_organizer_ids, 1) > 0
AND NOT EXISTS (
    SELECT 1 FROM event_organizers eo 
    WHERE eo.event_id = e.id 
    AND eo.organizer_id = ANY(e.other_organizer_ids)
)
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- 4. Check the bulk upload API process
-- This shows what the bulk upload should be doing
SELECT 
    'Bulk Upload Process Check' as check_type,
    'The bulk upload should:' as step_1,
    '1. Parse organizers from Excel/Word files' as step_2,
    '2. Match organizer names to database IDs' as step_3,
    '3. Save to other_organizer_ids array AND event_organizers junction table' as step_4,
    '4. Update events_with_details view should show the data' as step_5;

-- 5. Verify the final state
SELECT 
    'Final Verification' as check_type,
    COUNT(*) as total_events,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM event_organizers WHERE event_id = e.id AND is_main_organizer = FALSE) THEN 1 END) as events_with_additional_organizers,
    COUNT(CASE WHEN e.other_organizer_ids IS NOT NULL AND array_length(e.other_organizer_ids, 1) > 0 THEN 1 END) as events_with_other_organizer_ids
FROM events e
WHERE e.title ILIKE '%grand round%';

-- 6. Show the current state of Grand Rounds
SELECT 
    id,
    title,
    date,
    organizer_name,
    json_array_length(organizers::json) as total_organizers,
    json_array_length(other_organizers::json) as additional_organizers,
    CASE 
        WHEN json_array_length(other_organizers::json) > 0 THEN '✅ FIXED'
        ELSE '❌ STILL NEEDS FIXING'
    END as status
FROM events_with_details 
WHERE title ILIKE '%grand round%'
ORDER BY date DESC, title;


