-- Check existing certificates for the specific event and user
SELECT 
  id,
  user_id,
  event_id,
  template_id,
  certificate_filename,
  certificate_url,
  created_at,
  sent_via_email,
  email_sent_at
FROM certificates 
WHERE event_id = '2d9e3d0e-6d31-4afe-baa4-5604e817a09b' 
  AND user_id = '02c99dc5-1a2b-4e42-8965-f46ac1f84858';

-- Check all certificates for this event
SELECT 
  id,
  user_id,
  event_id,
  template_id,
  certificate_filename,
  created_at
FROM certificates 
WHERE event_id = '2d9e3d0e-6d31-4afe-baa4-5604e817a09b';

-- Check the unique constraint
SELECT 
  event_id,
  user_id,
  COUNT(*) as certificate_count
FROM certificates 
GROUP BY event_id, user_id 
HAVING COUNT(*) > 1;
