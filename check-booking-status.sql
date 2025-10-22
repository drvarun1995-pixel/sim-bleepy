-- Check the exact status of the booking for your event
SELECT 
  eb.id,
  eb.event_id,
  eb.user_id,
  eb.status,
  eb.checked_in,
  eb.booked_at,
  u.name as user_name,
  u.email
FROM event_bookings eb
JOIN users u ON eb.user_id = u.id
WHERE eb.event_id = '281fef32-611a-4dcc-acab-e1994e822a80';

-- Check all possible booking statuses in your database
SELECT DISTINCT status, COUNT(*) as count 
FROM event_bookings 
GROUP BY status;

-- Check what events those 10 'confirmed' bookings are for
SELECT 
  eb.event_id,
  e.title as event_title,
  COUNT(*) as booking_count
FROM event_bookings eb
JOIN events e ON eb.event_id = e.id
WHERE eb.status = 'confirmed'
GROUP BY eb.event_id, e.title
ORDER BY booking_count DESC;
