-- ============================================================================
-- CREATE EVENT BOOKINGS TABLE
-- ============================================================================
-- This migration creates the event_bookings table to track user bookings/registrations
-- 
-- Features:
-- - Tracks booking status (confirmed, waitlist, cancelled, attended, no-show)
-- - Stores confirmation checkbox states
-- - Includes check-in tracking for attendance
-- - Prevents duplicate bookings with unique constraint
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating Event Bookings Table';
  RAISE NOTICE '========================================';
END $$;

-- Create event_bookings table
CREATE TABLE IF NOT EXISTS event_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  -- Status options: 'confirmed', 'waitlist', 'cancelled', 'attended', 'no-show'
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  -- Store confirmation checkbox states from booking modal
  confirmation_checkbox_1_checked BOOLEAN DEFAULT FALSE,
  confirmation_checkbox_2_checked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate bookings (one booking per user per event)
  UNIQUE(event_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_bookings_event_id ON event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_user_id ON event_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON event_bookings(status);
CREATE INDEX IF NOT EXISTS idx_event_bookings_booked_at ON event_bookings(booked_at);
CREATE INDEX IF NOT EXISTS idx_event_bookings_checked_in ON event_bookings(checked_in);

-- Add comprehensive comments
COMMENT ON TABLE event_bookings IS 'Tracks user bookings/registrations for events with booking enabled';
COMMENT ON COLUMN event_bookings.status IS 'Booking status: confirmed (has spot), waitlist (waiting for spot), cancelled (user cancelled), attended (marked present), no-show (did not attend)';
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

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Event Bookings Table Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table: event_bookings';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - Tracks booking status (confirmed/waitlist/cancelled/attended/no-show)';
  RAISE NOTICE '  - Prevents duplicate bookings per user per event';
  RAISE NOTICE '  - Stores confirmation checkbox states';
  RAISE NOTICE '  - Includes check-in tracking';
  RAISE NOTICE '  - Auto-updating timestamps';
  RAISE NOTICE '  - Performance indexes';
  RAISE NOTICE '========================================';
END $$;


