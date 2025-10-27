-- =====================================================
-- SETUP BOOKING SYSTEM - PROPER IMPLEMENTATION
-- =====================================================
-- This script sets up the booking system exactly as it was previously implemented
-- Based on the existing migration files
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'SETTING UP BOOKING SYSTEM - PROPER IMPLEMENTATION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'This will create the complete booking system';
  RAISE NOTICE 'Based on existing migration files';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 1: ADD BOOKING FIELDS TO EVENTS TABLE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'STEP 1/4: Adding booking fields to events table...';
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
  RAISE NOTICE '  ✓ Added 8 booking fields to events table';
  RAISE NOTICE '  ✓ Added performance index';
END $$;

-- =====================================================
-- STEP 2: CREATE EVENT_BOOKINGS TABLE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'STEP 2/4: Creating event_bookings table...';
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
  RAISE NOTICE '  ✓ Created event_bookings table';
  RAISE NOTICE '  ✓ Added 5 performance indexes';
  RAISE NOTICE '  ✓ Added auto-update trigger';
END $$;

-- =====================================================
-- STEP 3: CREATE BOOKING STATISTICS VIEW
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'STEP 3/4: Creating booking statistics view...';
END $$;

-- Create or replace the booking statistics view
CREATE OR REPLACE VIEW event_booking_stats AS
SELECT 
  e.id as event_id,
  e.title,
  e.date,
  e.start_time,
  e.end_time,
  e.booking_capacity,
  e.booking_enabled,
  e.booking_button_label,
  e.booking_deadline_hours,
  e.allow_waitlist,
  
  -- Booking counts by status
  COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN eb.status = 'waitlist' THEN 1 END) as waitlist_count,
  COUNT(CASE WHEN eb.status = 'cancelled' THEN 1 END) as cancelled_count,
  COUNT(CASE WHEN eb.status = 'attended' THEN 1 END) as attended_count,
  COUNT(CASE WHEN eb.status = 'no-show' THEN 1 END) as no_show_count,
  
  -- Total bookings (excluding cancelled)
  COUNT(CASE WHEN eb.status IN ('confirmed', 'waitlist', 'attended', 'no-show') THEN 1 END) as total_bookings,
  
  -- Available slots calculation
  CASE 
    WHEN e.booking_capacity IS NULL THEN NULL  -- Unlimited capacity
    ELSE GREATEST(0, e.booking_capacity - COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END))
  END as available_slots,
  
  -- Capacity utilization percentage
  CASE 
    WHEN e.booking_capacity IS NULL THEN NULL
    WHEN e.booking_capacity = 0 THEN 0
    ELSE ROUND(
      (COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END)::DECIMAL / e.booking_capacity) * 100, 
      1
    )
  END as capacity_utilization_percent,
  
  -- Booking status summary
  CASE 
    WHEN e.booking_capacity IS NULL THEN 'unlimited'
    WHEN COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) >= e.booking_capacity THEN 'full'
    WHEN COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) >= (e.booking_capacity * 0.8) THEN 'almost_full'
    ELSE 'available'
  END as booking_status

FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id
WHERE e.booking_enabled = TRUE  -- Only show events with booking enabled
GROUP BY 
  e.id, 
  e.title, 
  e.date, 
  e.start_time, 
  e.end_time, 
  e.booking_capacity, 
  e.booking_enabled,
  e.booking_button_label,
  e.booking_deadline_hours,
  e.allow_waitlist;

-- Add comment
COMMENT ON VIEW event_booking_stats IS 'Provides booking statistics and capacity information for events with booking enabled';

DO $$
BEGIN
  RAISE NOTICE '  ✓ Created event_booking_stats view';
  RAISE NOTICE '  ✓ Added booking counts by status';
  RAISE NOTICE '  ✓ Added capacity calculations';
END $$;

-- =====================================================
-- STEP 4: SETUP RLS POLICIES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'STEP 4/4: Setting up RLS policies...';
END $$;

-- Enable RLS on event_bookings table
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can create bookings for any event
CREATE POLICY "Users can create bookings"
ON event_bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own bookings (mainly for cancellation)
CREATE POLICY "Users can update own bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
);

-- Policy 5: Admins can update all bookings (mark attended, move waitlist, etc.)
CREATE POLICY "Admins can update all bookings"
ON event_bookings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
);

-- Policy 6: Admins can delete bookings (for data cleanup)
CREATE POLICY "Admins can delete bookings"
ON event_bookings FOR DELETE
TO authenticated
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
  RAISE NOTICE '  ✓ Users can manage own bookings';
  RAISE NOTICE '  ✓ Admins can manage all bookings';
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

-- Check that view was created
SELECT 
  'Booking Stats View' as check_type,
  viewname,
  '✅ CREATED' as status
FROM pg_views
WHERE schemaname = 'public' 
  AND viewname = 'event_booking_stats';

-- Check that policies were created
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'event_bookings';

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
  RAISE NOTICE '  ✓ All fields have proper defaults';
  RAISE NOTICE '';
  RAISE NOTICE '📊 EVENT_BOOKINGS TABLE:';
  RAISE NOTICE '  ✓ Complete table with all required columns';
  RAISE NOTICE '  ✓ 5 performance indexes';
  RAISE NOTICE '  ✓ Auto-update trigger for updated_at';
  RAISE NOTICE '  ✓ Unique constraint (one booking per user per event)';
  RAISE NOTICE '';
  RAISE NOTICE '📈 BOOKING STATISTICS VIEW:';
  RAISE NOTICE '  ✓ event_booking_stats view created';
  RAISE NOTICE '  ✓ Booking counts by status';
  RAISE NOTICE '  ✓ Capacity calculations';
  RAISE NOTICE '  ✓ Only shows events with booking enabled';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SECURITY:';
  RAISE NOTICE '  ✓ RLS enabled on event_bookings table';
  RAISE NOTICE '  ✓ 6 RLS policies for proper access control';
  RAISE NOTICE '  ✓ Users can only see their own bookings';
  RAISE NOTICE '  ✓ Admins can manage all bookings';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '  1. Enable booking on events in Event Data page';
  RAISE NOTICE '  2. Test booking functionality';
  RAISE NOTICE '  3. Check admin booking management';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Booking system is ready to use! 🚀';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
END $$;



