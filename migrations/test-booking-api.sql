-- Test if we can query bookings for the specific event
SELECT 
  eb.id,
  eb.event_id,
  eb.user_id,
  eb.status,
  eb.booked_at,
  e.title as event_title
FROM event_bookings eb
JOIN events e ON eb.event_id = e.id
WHERE eb.event_id = 'df9ab175-88e8-48db-8c77-ccd34d31dce2'
ORDER BY eb.booked_at DESC;



