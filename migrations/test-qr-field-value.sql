-- Test if qr_attendance_enabled field has values in the view
SELECT id, title, qr_attendance_enabled, booking_enabled
FROM events_with_details 
LIMIT 5;



