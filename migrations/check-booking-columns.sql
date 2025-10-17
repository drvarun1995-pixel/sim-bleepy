-- Check what columns actually exist in event_bookings table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'event_bookings' 
ORDER BY ordinal_position;
