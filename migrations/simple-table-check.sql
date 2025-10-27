-- Simple check for event_bookings table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_bookings'
ORDER BY ordinal_position;



