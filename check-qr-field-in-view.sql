-- Check if qr_attendance_enabled field exists in events_with_details view
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
AND column_name = 'qr_attendance_enabled';

-- Check if the field exists in the events table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'qr_attendance_enabled';

-- Test querying the view with qr_attendance_enabled
SELECT id, title, qr_attendance_enabled, booking_enabled
FROM events_with_details 
LIMIT 3;
