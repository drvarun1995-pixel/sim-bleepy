-- =====================================================
-- FIX DUPLICATE MAIN ORGANIZERS IN EVENT_ORGANIZERS TABLE
-- =====================================================
-- This removes main organizers from the event_organizers junction table
-- since they should only be stored in the events.organizer_id field
-- =====================================================

BEGIN;

-- Remove main organizers from event_organizers junction table
-- where the organizer_id matches the main organizer_id in the events table
DELETE FROM event_organizers 
WHERE EXISTS (
  SELECT 1 
  FROM events 
  WHERE events.id = event_organizers.event_id 
    AND events.organizer_id = event_organizers.organizer_id
);

-- Show how many records were affected
SELECT 
  'Main organizers removed from junction table' as action,
  COUNT(*) as affected_events
FROM events e
WHERE EXISTS (
  SELECT 1 
  FROM event_organizers eo 
  WHERE eo.event_id = e.id 
    AND eo.organizer_id = e.organizer_id
);

COMMIT;
