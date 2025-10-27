-- DIAGNOSTIC ONLY - No fixes or modifications
-- Check if qr_attendance_enabled field exists in events table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'qr_attendance_enabled';

-- Check if qr_attendance_enabled field exists in events_with_details view
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
AND column_name = 'qr_attendance_enabled';

-- Check actual values in the events table (only if field exists)
SELECT id, title, booking_enabled, status
FROM events 
ORDER BY created_at DESC 
LIMIT 5;

-- List all columns in events table to see what QR-related fields exist
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'events' 
AND (column_name LIKE '%qr%' OR column_name LIKE '%attendance%')
ORDER BY column_name;

-- List all columns in events_with_details view to see what QR-related fields exist
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
AND (column_name LIKE '%qr%' OR column_name LIKE '%attendance%')
ORDER BY column_name;

