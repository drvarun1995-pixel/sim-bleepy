-- Check if qr_attendance_enabled field exists in events_with_details view
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
AND column_name = 'qr_attendance_enabled';



