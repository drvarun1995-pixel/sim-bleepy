-- =====================================================
-- DEBUG BLOOD TESTS INTERPRETATION EVENT
-- =====================================================
-- Let's check and fix the specific event you're testing
-- =====================================================

-- 1. Find the Blood Tests Interpretation event
SELECT 
  id,
  title,
  booking_enabled,
  booking_button_label,
  booking_capacity,
  booking_deadline_hours,
  allow_waitlist,
  confirmation_checkbox_1_text,
  confirmation_checkbox_1_required,
  confirmation_checkbox_2_text,
  confirmation_checkbox_2_required,
  created_at,
  updated_at
FROM events 
WHERE title ILIKE '%Blood Tests Interpretation%'
ORDER BY created_at DESC;

-- 2. Check if this event's booking fields are accessible from the view
SELECT 
  id,
  title,
  booking_enabled,
  booking_button_label,
  booking_capacity
FROM events_with_details 
WHERE title ILIKE '%Blood Tests Interpretation%';

-- 3. Update this specific event to have booking enabled (for testing)
UPDATE events SET
  booking_enabled = true,
  booking_button_label = 'Register for Blood Tests',
  booking_capacity = 25,
  booking_deadline_hours = 2,
  allow_waitlist = true,
  confirmation_checkbox_1_text = 'I confirm my attendance at this blood tests event',
  confirmation_checkbox_1_required = true,
  confirmation_checkbox_2_text = 'I understand this is a medical training session',
  confirmation_checkbox_2_required = false,
  updated_at = NOW()
WHERE title ILIKE '%Blood Tests Interpretation%';

-- 4. Verify the update worked
SELECT 
  id,
  title,
  booking_enabled,
  booking_button_label,
  booking_capacity,
  confirmation_checkbox_1_text
FROM events 
WHERE title ILIKE '%Blood Tests Interpretation%';

-- 5. Test if we can query this from the view
SELECT 
  id,
  title,
  booking_enabled,
  booking_button_label,
  booking_capacity
FROM events_with_details 
WHERE title ILIKE '%Blood Tests Interpretation%';

