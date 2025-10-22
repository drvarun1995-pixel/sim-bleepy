-- Create Test Certificates for My Certificates Page
-- Run this AFTER setting up the certificate system

-- Step 1: Create some sample bookings first (if you don't have any)
-- Replace the UUIDs with actual event and user IDs from your database

-- First, check what events and users you have:
SELECT 'Events:' as type, id, title FROM events WHERE booking_enabled = true LIMIT 5;
SELECT 'Users:' as type, id, name, email FROM users LIMIT 5;

-- Step 2: Create sample bookings (replace UUIDs with actual ones)
INSERT INTO event_bookings (event_id, user_id, status, checked_in, booked_at)
SELECT 
  (SELECT id FROM events WHERE booking_enabled = true ORDER BY date DESC LIMIT 1), -- First booking-enabled event
  users.id, -- All users
  'confirmed',
  CASE WHEN random() > 0.5 THEN true ELSE false END, -- Random check-in status
  NOW() - (random() * interval '7 days') -- Random booking date in last 7 days
FROM users 
WHERE users.email IS NOT NULL
LIMIT 3; -- Limit to 3 users for testing

-- Step 3: Create sample certificates (replace UUIDs with actual ones)
-- Get the booking data we just created
WITH recent_bookings AS (
  SELECT 
    eb.event_id,
    eb.user_id,
    e.title as event_title,
    u.name as user_name,
    u.email as user_email
  FROM event_bookings eb
  JOIN events e ON eb.event_id = e.id
  JOIN users u ON eb.user_id = u.id
  WHERE eb.status = 'confirmed'
  ORDER BY eb.booked_at DESC
  LIMIT 3
)
INSERT INTO certificates (
  id,
  event_id,
  user_id,
  template_id,
  certificate_url,
  certificate_filename,
  certificate_data,
  generated_at,
  sent_via_email,
  created_by
)
SELECT 
  'cert-' || rb.user_id || '-' || rb.event_id as id,
  rb.event_id,
  rb.user_id,
  NULL as template_id, -- No template for now
  'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Certificate+' || rb.user_name as certificate_url,
  'certificate_' || rb.event_title || '_' || rb.user_name || '.png' as certificate_filename,
  jsonb_build_object(
    'event_title', rb.event_title,
    'event_date', '2024-12-15',
    'attendee_name', rb.user_name,
    'attendee_email', rb.user_email,
    'certificate_date', NOW()::date,
    'certificate_id', 'CERT-' || rb.user_id
  ) as certificate_data,
  NOW() as generated_at,
  false as sent_via_email,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
FROM recent_bookings rb;

-- Step 4: Check the results
SELECT 
  'Certificates created:' as status,
  COUNT(*) as count
FROM certificates;

SELECT 
  c.id,
  c.certificate_filename,
  c.certificate_data->>'event_title' as event_title,
  c.certificate_data->>'attendee_name' as attendee_name,
  c.certificate_data->>'certificate_id' as certificate_id,
  c.generated_at
FROM certificates c
ORDER BY c.generated_at DESC;










