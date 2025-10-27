-- Check if event_booking_stats view exists and what columns it has
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'event_booking_stats'
ORDER BY ordinal_position;



