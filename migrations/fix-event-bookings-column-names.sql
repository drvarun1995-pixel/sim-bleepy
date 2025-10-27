-- =====================================================
-- FIX EVENT_BOOKINGS COLUMN NAMES
-- =====================================================
-- The table exists but has different column names than expected
-- We need to rename columns to match the existing code
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'FIXING EVENT_BOOKINGS COLUMN NAMES';
  RAISE NOTICE '=====================================================';
END $$;

-- Rename columns to match expected names
ALTER TABLE event_bookings 
RENAME COLUMN booking_date TO booked_at;

ALTER TABLE event_bookings 
RENAME COLUMN confirmation_sent TO checked_in;

ALTER TABLE event_bookings 
RENAME COLUMN confirmation_sent_at TO checked_in_at;

ALTER TABLE event_bookings 
RENAME COLUMN cancellation_date TO cancelled_at;

ALTER TABLE event_bookings 
RENAME COLUMN confirmation_checkbox_1 TO confirmation_checkbox_1_checked;

ALTER TABLE event_bookings 
RENAME COLUMN confirmation_checkbox_2 TO confirmation_checkbox_2_checked;

-- Add missing columns that the code expects
ALTER TABLE event_bookings 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Update the status column to have proper constraint
ALTER TABLE event_bookings 
DROP CONSTRAINT IF EXISTS event_bookings_status_check;

ALTER TABLE event_bookings 
ADD CONSTRAINT event_bookings_status_check 
CHECK (status IN ('confirmed', 'waitlist', 'cancelled', 'attended', 'no-show'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_bookings_event_id ON event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_user_id ON event_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON event_bookings(status);
CREATE INDEX IF NOT EXISTS idx_event_bookings_booked_at ON event_bookings(booked_at);
CREATE INDEX IF NOT EXISTS idx_event_bookings_checked_in ON event_bookings(checked_in);

-- Add comments
COMMENT ON TABLE event_bookings IS 'Tracks user bookings/registrations for events with booking enabled';
COMMENT ON COLUMN event_bookings.status IS 'Booking status: confirmed, waitlist, cancelled, attended, no-show';
COMMENT ON COLUMN event_bookings.booked_at IS 'When user made the booking';
COMMENT ON COLUMN event_bookings.cancelled_at IS 'When user cancelled (if applicable)';
COMMENT ON COLUMN event_bookings.cancellation_reason IS 'User-provided reason for cancellation';
COMMENT ON COLUMN event_bookings.checked_in IS 'Whether user checked in at the event';
COMMENT ON COLUMN event_bookings.checked_in_at IS 'When user checked in (for attendance tracking)';
COMMENT ON COLUMN event_bookings.confirmation_checkbox_1_checked IS 'Whether user checked first confirmation checkbox during booking';
COMMENT ON COLUMN event_bookings.confirmation_checkbox_2_checked IS 'Whether user checked second confirmation checkbox during booking';
COMMENT ON COLUMN event_bookings.notes IS 'Additional notes about the booking';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_event_bookings_updated_at
  BEFORE UPDATE ON event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_event_bookings_updated_at();

-- Verify the table now has correct column names
SELECT 
  'Fixed Columns' as check_type,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_bookings'
ORDER BY ordinal_position;

-- Commit transaction
COMMIT;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ EVENT_BOOKINGS COLUMN NAMES FIXED!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Renamed columns to match expected names:';
  RAISE NOTICE '  - booking_date → booked_at';
  RAISE NOTICE '  - confirmation_sent → checked_in';
  RAISE NOTICE '  - confirmation_sent_at → checked_in_at';
  RAISE NOTICE '  - cancellation_date → cancelled_at';
  RAISE NOTICE '  - confirmation_checkbox_1 → confirmation_checkbox_1_checked';
  RAISE NOTICE '  - confirmation_checkbox_2 → confirmation_checkbox_2_checked';
  RAISE NOTICE 'Added missing columns and indexes';
  RAISE NOTICE 'Table is now ready for use!';
  RAISE NOTICE '=====================================================';
END $$;



