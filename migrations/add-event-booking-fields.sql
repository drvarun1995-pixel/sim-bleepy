-- ============================================================================
-- ADD EVENT BOOKING CONFIGURATION FIELDS
-- ============================================================================
-- This migration adds booking-related configuration fields to the events table
-- 
-- Booking is OFF by default - admins must explicitly enable it per event
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Adding Event Booking Configuration Fields';
  RAISE NOTICE '========================================';
END $$;

-- Add booking configuration fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS booking_button_label VARCHAR(50) DEFAULT 'Register',
ADD COLUMN IF NOT EXISTS booking_capacity INTEGER,
ADD COLUMN IF NOT EXISTS booking_deadline_hours INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS allow_waitlist BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS confirmation_checkbox_1_text TEXT DEFAULT 'I confirm my attendance at this event',
ADD COLUMN IF NOT EXISTS confirmation_checkbox_1_required BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS confirmation_checkbox_2_text TEXT,
ADD COLUMN IF NOT EXISTS confirmation_checkbox_2_required BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN events.booking_enabled IS 'Whether bookings are enabled for this event (default: false - opt-in)';
COMMENT ON COLUMN events.booking_button_label IS 'Custom label for booking button (e.g., Register, Book Now, Reserve Spot)';
COMMENT ON COLUMN events.booking_capacity IS 'Maximum bookings allowed (NULL = unlimited capacity)';
COMMENT ON COLUMN events.booking_deadline_hours IS 'Hours before event start when bookings close (default: 1 hour)';
COMMENT ON COLUMN events.allow_waitlist IS 'Allow waitlist when capacity reached (default: true)';
COMMENT ON COLUMN events.confirmation_checkbox_1_text IS 'Text for first confirmation checkbox (default: attendance confirmation)';
COMMENT ON COLUMN events.confirmation_checkbox_1_required IS 'Whether first checkbox must be checked to complete booking (default: true)';
COMMENT ON COLUMN events.confirmation_checkbox_2_text IS 'Text for second checkbox (NULL = not shown, optional)';
COMMENT ON COLUMN events.confirmation_checkbox_2_required IS 'Whether second checkbox must be checked (only applies if text is set)';

-- Create index on booking_enabled for performance
CREATE INDEX IF NOT EXISTS idx_events_booking_enabled ON events(booking_enabled) WHERE booking_enabled = TRUE;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Event Booking Fields Added Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fields added:';
  RAISE NOTICE '  - booking_enabled (default: false)';
  RAISE NOTICE '  - booking_button_label (default: "Register")';
  RAISE NOTICE '  - booking_capacity (optional)';
  RAISE NOTICE '  - booking_deadline_hours (default: 1)';
  RAISE NOTICE '  - allow_waitlist (default: true)';
  RAISE NOTICE '  - confirmation_checkbox_1_text (default: attendance)';
  RAISE NOTICE '  - confirmation_checkbox_1_required (default: true)';
  RAISE NOTICE '  - confirmation_checkbox_2_text (optional)';
  RAISE NOTICE '  - confirmation_checkbox_2_required (default: false)';
  RAISE NOTICE '';
  RAISE NOTICE 'Remember: Booking is OFF by default for all events!';
  RAISE NOTICE 'Admins must enable it per event in the Booking tab.';
  RAISE NOTICE '========================================';
END $$;

