-- Debug script to check QR attendance field in database
-- Check if the field exists in the events table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'qr_attendance_enabled';

-- Check if the field exists in the events_with_details view
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
AND column_name = 'qr_attendance_enabled';

-- Check actual values in the events table
SELECT id, title, qr_attendance_enabled, booking_enabled, status
FROM events 
ORDER BY created_at DESC 
LIMIT 5;

-- Check values in the events_with_details view (commented out since field doesn't exist)
-- SELECT id, title, qr_attendance_enabled, booking_enabled, status
-- FROM events_with_details 
-- ORDER BY created_at DESC 
-- LIMIT 5;
