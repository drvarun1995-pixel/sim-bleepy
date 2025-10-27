-- =====================================================
-- FIX EVENT_BOOKINGS TABLE - ADD MISSING COLUMNS
-- =====================================================
-- The table exists but has no columns, so we need to add them
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'FIXING EVENT_BOOKINGS TABLE - ADDING COLUMNS';
  RAISE NOTICE '=====================================================';
END $$;

-- Add all required columns to the existing event_bookings table
ALTER TABLE event_bookings 
ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ADD COLUMN event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
ADD COLUMN booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN checked_in BOOLEAN DEFAULT FALSE,
ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN confirmation_checkbox_1_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN confirmation_checkbox_2_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN notes TEXT,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add unique constraint
ALTER TABLE event_bookings ADD CONSTRAINT event_bookings_event_user_unique UNIQUE(event_id, user_id);

-- Create indexes for performance
CREATE INDEX idx_event_bookings_event_id ON event_bookings(event_id);
CREATE INDEX idx_event_bookings_user_id ON event_bookings(user_id);
CREATE INDEX idx_event_bookings_status ON event_bookings(status);
CREATE INDEX idx_event_bookings_booked_at ON event_bookings(booked_at);
CREATE INDEX idx_event_bookings_checked_in ON event_bookings(checked_in);

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

-- Verify the table now has columns
SELECT 
  'Fixed Table' as check_type,
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
  RAISE NOTICE '✅ EVENT_BOOKINGS TABLE FIXED!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Added 13 columns to existing table';
  RAISE NOTICE 'Added 5 performance indexes';
  RAISE NOTICE 'Added auto-update trigger';
  RAISE NOTICE 'Table is now ready for use!';
  RAISE NOTICE '=====================================================';
END $$;



