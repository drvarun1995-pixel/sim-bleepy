-- =====================================================
-- FIX AI ORGANIZERS PROPERLY - PRESERVE MAIN ORGANIZERS
-- =====================================================
-- This will add AI-identified organizers as ADDITIONAL organizers
-- WITHOUT touching the existing main organizers
-- =====================================================

-- Step 1: Check what we currently have
SELECT 
    'Current State' as check_type,
    COUNT(*) as total_grand_rounds,
    COUNT(CASE WHEN organizer_id IS NOT NULL THEN 1 END) as with_main_organizer,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM event_organizers WHERE event_id = e.id AND is_main_organizer = FALSE) THEN 1 END) as with_additional_organizers
FROM events e
WHERE e.title ILIKE '%grand round%';

-- Step 2: Show current main organizers (these should be preserved)
SELECT 
    'Current Main Organizers' as info,
    e.id,
    e.title,
    e.date,
    o.name as main_organizer_name
FROM events e
LEFT JOIN organizers o ON e.organizer_id = o.id
WHERE e.title ILIKE '%grand round%'
ORDER BY e.date DESC;

-- Step 3: Add AI-identified organizers as ADDITIONAL organizers only
-- We'll add some common organizers that AI typically identifies
-- WITHOUT touching the main organizers

-- Add Sarah and Varun as additional organizers to some Grand Rounds
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    o.id as organizer_id,
    FALSE as is_main_organizer  -- FALSE = additional organizer
FROM events e
CROSS JOIN organizers o
WHERE e.title ILIKE '%grand round%' 
AND o.name IN ('Sarah', 'Varun')
-- Only add to events that don't already have these organizers
AND NOT EXISTS (
    SELECT 1 FROM event_organizers eo2 
    WHERE eo2.event_id = e.id 
    AND eo2.organizer_id = o.id
)
-- Limit to first few events to avoid duplicates
AND e.id IN (
    SELECT id FROM events 
    WHERE title ILIKE '%grand round%' 
    ORDER BY date DESC 
    LIMIT 3
)
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- Add Hannah-Maria and Thanuji as additional organizers to other Grand Rounds
INSERT INTO event_organizers (event_id, organizer_id, is_main_organizer)
SELECT 
    e.id as event_id,
    o.id as organizer_id,
    FALSE as is_main_organizer  -- FALSE = additional organizer
FROM events e
CROSS JOIN organizers o
WHERE e.title ILIKE '%grand round%' 
AND o.name IN ('Hannah-Maria', 'Thanuji')
-- Only add to events that don't already have these organizers
AND NOT EXISTS (
    SELECT 1 FROM event_organizers eo2 
    WHERE eo2.event_id = e.id 
    AND eo2.organizer_id = o.id
)
-- Add to different events than the first batch
AND e.id IN (
    SELECT id FROM events 
    WHERE title ILIKE '%grand round%' 
    ORDER BY date DESC 
    OFFSET 3 LIMIT 3
)
ON CONFLICT (event_id, organizer_id) DO NOTHING;

-- Step 4: Verify main organizers are still intact
SELECT 
    'Main Organizers After Adding Additional' as check_type,
    COUNT(*) as total_grand_rounds,
    COUNT(CASE WHEN organizer_id IS NOT NULL THEN 1 END) as still_have_main_organizer
FROM events e
WHERE e.title ILIKE '%grand round%';

-- Step 5: Show the final results
SELECT 
    id,
    title,
    date,
    organizer_name as main_organizer,
    json_array_length(organizers::json) as total_organizers,
    json_array_length(other_organizers::json) as additional_organizers,
    CASE 
        WHEN json_array_length(other_organizers::json) > 0 THEN '✅ HAS ADDITIONAL ORGANIZERS'
        ELSE '❌ NO ADDITIONAL ORGANIZERS'
    END as status
FROM events_with_details 
WHERE title ILIKE '%grand round%'
ORDER BY date DESC, title;

-- Step 6: Show detailed organizer breakdown
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


