-- =====================================================
-- SETUP BOOKING SYSTEM - SIMPLE VERSION
-- =====================================================
-- This script creates the booking system step by step
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'SETTING UP BOOKING SYSTEM - SIMPLE VERSION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 1: ADD BOOKING FIELDS TO EVENTS TABLE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'STEP 1/3: Adding booking fields to events table...';
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

-- Create index on booking_enabled for performance
CREATE INDEX IF NOT EXISTS idx_events_booking_enabled ON events(booking_enabled) WHERE booking_enabled = TRUE;

DO $$
BEGIN
  RAISE NOTICE '  ✓ Added 8 booking fields to events table';
  RAISE NOTICE '  ✓ Added performance index';
END $$;

-- =====================================================
-- STEP 2: CREATE EVENT_BOOKINGS TABLE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'STEP 2/3: Creating event_bookings table...';
END $$;

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS event_bookings CASCADE;

-- Create event_bookings table
CREATE TABLE event_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  confirmation_checkbox_1_checked BOOLEAN DEFAULT FALSE,
  confirmation_checkbox_2_checked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate bookings (one booking per user per event)
  UNIQUE(event_id, user_id)
);

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

DO $$
BEGIN
  RAISE NOTICE '  ✓ Created event_bookings table';
  RAISE NOTICE '  ✓ Added 5 performance indexes';
  RAISE NOTICE '  ✓ Added auto-update trigger';
END $$;

-- =====================================================
-- STEP 3: ENABLE RLS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'STEP 3/3: Enabling RLS...';
END $$;

-- Enable RLS on event_bookings table
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own bookings"
ON event_bookings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
ON event_bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
ON event_bookings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
ON event_bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
);

CREATE POLICY "Admins can update all bookings"
ON event_bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
);

CREATE POLICY "Admins can delete bookings"
ON event_bookings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
);

DO $$
BEGIN
  RAISE NOTICE '  ✓ Enabled RLS on event_bookings table';
  RAISE NOTICE '  ✓ Created 6 RLS policies';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that booking columns were added to events
SELECT 
  'Events Table' as check_type,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'events' 
  AND column_name LIKE 'booking_%'
ORDER BY column_name;

-- Check that event_bookings table was created
SELECT 
  'Event Bookings Table' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'event_bookings';

-- Check that policies were created
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'event_bookings';

-- Test insert to verify table works
INSERT INTO event_bookings (event_id, user_id, status, notes) 
VALUES (
  (SELECT id FROM events LIMIT 1),
  (SELECT id FROM users LIMIT 1),
  'confirmed',
  'Test booking'
);

-- Clean up test data
DELETE FROM event_bookings WHERE notes = 'Test booking';

-- Commit transaction
COMMIT;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ BOOKING SYSTEM SETUP COMPLETE!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 WHAT WAS CREATED:';
  RAISE NOTICE '';
  RAISE NOTICE '📅 EVENTS TABLE:';
  RAISE NOTICE '  ✓ 8 booking configuration fields added';
  RAISE NOTICE '  ✓ Performance index on booking_enabled';
  RAISE NOTICE '';
  RAISE NOTICE '📊 EVENT_BOOKINGS TABLE:';
  RAISE NOTICE '  ✓ Complete table with all required columns';
  RAISE NOTICE '  ✓ 5 performance indexes';
  RAISE NOTICE '  ✓ Auto-update trigger for updated_at';
  RAISE NOTICE '  ✓ Unique constraint (one booking per user per event)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SECURITY:';
  RAISE NOTICE '  ✓ RLS enabled on event_bookings table';
  RAISE NOTICE '  ✓ 6 RLS policies for proper access control';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '  1. Test the table structure';
  RAISE NOTICE '  2. Create booking statistics view if needed';
  RAISE NOTICE '  3. Enable booking on events in Event Data page';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Booking system is ready! 🚀';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
END $$;



