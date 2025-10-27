-- Script to delete the test event and its associated bookings
-- This will help you clean up the test event that has bookings

-- 1. First, let's see what bookings exist for the test event
SELECT 
    eb.id as booking_id,
    eb.event_id,
    eb.user_id,
    eb.status,
    eb.booked_at,
    e.title as event_title
FROM event_bookings eb
JOIN events e ON eb.event_id = e.id
WHERE e.title ILIKE '%test%'
ORDER BY eb.booked_at DESC;

-- 2. Delete all bookings for the test event
DELETE FROM event_bookings 
WHERE event_id IN (
    SELECT id FROM events WHERE title ILIKE '%test%'
);

-- 3. Delete all category assignments for the test event
DELETE FROM event_categories 
WHERE event_id IN (
    SELECT id FROM events WHERE title ILIKE '%test%'
);

-- 4. Delete all organizer assignments for the test event
DELETE FROM event_organizers 
WHERE event_id IN (
    SELECT id FROM events WHERE title ILIKE '%test%'
);

-- 5. Delete all speaker assignments for the test event
DELETE FROM event_speakers 
WHERE event_id IN (
    SELECT id FROM events WHERE title ILIKE '%test%'
);

-- 6. Delete all location assignments for the test event
DELETE FROM event_locations 
WHERE event_id IN (
    SELECT id FROM events WHERE title ILIKE '%test%'
);

-- 7. Finally, delete the test event itself
DELETE FROM events 
WHERE title ILIKE '%test%';

-- 8. Verify the test event is deleted
SELECT 
    id,
    title,
    date,
    status
FROM events
WHERE title ILIKE '%test%';



