-- =====================================================
-- RESET ALL BOOKING SETTINGS TO DEFAULT
-- =====================================================
-- This will reset all booking settings to their default values
-- Use this to test from a clean state
-- =====================================================

BEGIN;

-- Reset all booking settings to default values
UPDATE events SET
  booking_enabled = false,
  booking_button_label = 'Register',
  booking_capacity = NULL,
  booking_deadline_hours = 1,
  allow_waitlist = true,
  confirmation_checkbox_1_text = 'I confirm my attendance at this event',
  confirmation_checkbox_1_required = true,
  confirmation_checkbox_2_text = '',
  confirmation_checkbox_2_required = false,
  updated_at = NOW()
WHERE id IS NOT NULL;

COMMIT;

-- Verification
SELECT 
  'Reset complete' as status,
  COUNT(*) as total_events_updated,
  COUNT(CASE WHEN booking_enabled = false THEN 1 END) as booking_disabled_count
FROM events;

