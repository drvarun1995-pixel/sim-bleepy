-- Test script to check QR attendance status for a specific event
-- Replace 'YOUR_EVENT_ID' with the actual event ID you're testing

-- Check the event in the events table
SELECT 
  id, 
  title, 
  qr_attendance_enabled, 
  booking_enabled, 
  status,
  created_at,
  updated_at
FROM events 
WHERE title ILIKE '%test%' OR title ILIKE '%demo%'
ORDER BY created_at DESC 
LIMIT 5;

-- Check the same event in the events_with_details view
SELECT 
  id, 
  title, 
  qr_attendance_enabled, 
  booking_enabled, 
  status,
  created_at,
  updated_at
FROM events_with_details 
WHERE title ILIKE '%test%' OR title ILIKE '%demo%'
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any QR codes for these events
SELECT 
  eqc.id,
  eqc.event_id,
  e.title,
  eqc.qr_code_image_url,
  eqc.active,
  eqc.created_at
FROM event_qr_codes eqc
JOIN events e ON eqc.event_id = e.id
WHERE e.title ILIKE '%test%' OR e.title ILIKE '%demo%'
ORDER BY eqc.created_at DESC;

