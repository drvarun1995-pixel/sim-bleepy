-- Quick Test Setup for Certificates
-- Run this to quickly test the certificate system

-- 1. Create a sample certificate for testing
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
) VALUES (
  'test-cert-001',
  (SELECT id FROM events WHERE booking_enabled = true LIMIT 1), -- Any booking-enabled event
  (SELECT id FROM users LIMIT 1), -- Any user
  NULL,
  'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Test+Certificate',
  'test_certificate_sample.png',
  jsonb_build_object(
    'event_title', 'Test Event',
    'event_date', '2024-12-15',
    'attendee_name', 'Test User',
    'attendee_email', 'test@example.com',
    'certificate_date', NOW()::date,
    'certificate_id', 'TEST-CERT-001'
  ),
  NOW(),
  false,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- 2. Check if it was created
SELECT 
  c.id,
  c.certificate_filename,
  c.certificate_data->>'event_title' as event_title,
  c.certificate_data->>'attendee_name' as attendee_name,
  c.user_id
FROM certificates c
WHERE c.id = 'test-cert-001';










