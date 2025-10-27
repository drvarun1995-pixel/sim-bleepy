-- Create event_booking_stats view
CREATE OR REPLACE VIEW event_booking_stats AS
SELECT 
  e.id as event_id,
  e.title,
  e.date,
  e.start_time,
  e.end_time,
  e.booking_capacity,
  e.booking_enabled,
  -- Count bookings by status
  COUNT(eb.id) FILTER (WHERE eb.status = 'confirmed') as confirmed_count,
  COUNT(eb.id) FILTER (WHERE eb.status = 'waitlist') as waitlist_count,
  COUNT(eb.id) FILTER (WHERE eb.status = 'cancelled') as cancelled_count,
  COUNT(eb.id) FILTER (WHERE eb.status = 'attended') as attended_count,
  COUNT(eb.id) as total_bookings,
  -- Determine booking status
  CASE 
    WHEN e.booking_capacity IS NULL THEN 'unlimited'
    WHEN COUNT(eb.id) FILTER (WHERE eb.status = 'confirmed') >= e.booking_capacity THEN 'full'
    WHEN COUNT(eb.id) FILTER (WHERE eb.status = 'confirmed') >= (e.booking_capacity * 0.8) THEN 'almost_full'
    ELSE 'available'
  END as booking_status
FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id
WHERE e.booking_enabled = true
GROUP BY e.id, e.title, e.date, e.start_time, e.end_time, e.booking_capacity, e.booking_enabled
ORDER BY e.date, e.start_time;



