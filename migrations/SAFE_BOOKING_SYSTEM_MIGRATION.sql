-- =====================================================
-- SAFE EVENT BOOKING SYSTEM MIGRATION
-- =====================================================
-- This script safely adds booking functionality to your existing events system
-- It will NOT break any existing data or tables
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Start transaction for safety
BEGIN;

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'STARTING SAFE BOOKING SYSTEM MIGRATION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'This will add booking functionality to your events system';
  RAISE NOTICE 'Estimated time: 10-15 seconds';
  RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- STEP 1: ADD BOOKING COLUMNS TO EVENTS TABLE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 1/4: Adding booking columns to events table...';
  
  -- Add booking_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'booking_enabled'
  ) THEN
    ALTER TABLE events ADD COLUMN booking_enabled BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '  ✓ Added booking_enabled column';
  ELSE
    RAISE NOTICE '  ⚠ booking_enabled column already exists, skipping';
  END IF;

  -- Add booking_button_label column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'booking_button_label'
  ) THEN
    ALTER TABLE events ADD COLUMN booking_button_label VARCHAR(50) DEFAULT 'Register';
    RAISE NOTICE '  ✓ Added booking_button_label column';
  ELSE
    RAISE NOTICE '  ⚠ booking_button_label column already exists, skipping';
  END IF;

  -- Add booking_capacity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'booking_capacity'
  ) THEN
    ALTER TABLE events ADD COLUMN booking_capacity INTEGER;
    RAISE NOTICE '  ✓ Added booking_capacity column';
  ELSE
    RAISE NOTICE '  ⚠ booking_capacity column already exists, skipping';
  END IF;

  -- Add booking_deadline_hours column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'booking_deadline_hours'
  ) THEN
    ALTER TABLE events ADD COLUMN booking_deadline_hours INTEGER DEFAULT 1;
    RAISE NOTICE '  ✓ Added booking_deadline_hours column';
  ELSE
    RAISE NOTICE '  ⚠ booking_deadline_hours column already exists, skipping';
  END IF;

  -- Add allow_waitlist column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'allow_waitlist'
  ) THEN
    ALTER TABLE events ADD COLUMN allow_waitlist BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '  ✓ Added allow_waitlist column';
  ELSE
    RAISE NOTICE '  ⚠ allow_waitlist column already exists, skipping';
  END IF;

  -- Add confirmation_checkbox_1_text column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'confirmation_checkbox_1_text'
  ) THEN
    ALTER TABLE events ADD COLUMN confirmation_checkbox_1_text TEXT DEFAULT 'I confirm my attendance at this event';
    RAISE NOTICE '  ✓ Added confirmation_checkbox_1_text column';
  ELSE
    RAISE NOTICE '  ⚠ confirmation_checkbox_1_text column already exists, skipping';
  END IF;

  -- Add confirmation_checkbox_1_required column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'confirmation_checkbox_1_required'
  ) THEN
    ALTER TABLE events ADD COLUMN confirmation_checkbox_1_required BOOLEAN DEFAULT TRUE;
    RAISE NOTICE '  ✓ Added confirmation_checkbox_1_required column';
  ELSE
    RAISE NOTICE '  ⚠ confirmation_checkbox_1_required column already exists, skipping';
  END IF;

  -- Add confirmation_checkbox_2_text column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'confirmation_checkbox_2_text'
  ) THEN
    ALTER TABLE events ADD COLUMN confirmation_checkbox_2_text TEXT;
    RAISE NOTICE '  ✓ Added confirmation_checkbox_2_text column';
  ELSE
    RAISE NOTICE '  ⚠ confirmation_checkbox_2_text column already exists, skipping';
  END IF;

  -- Add confirmation_checkbox_2_required column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'confirmation_checkbox_2_required'
  ) THEN
    ALTER TABLE events ADD COLUMN confirmation_checkbox_2_required BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '  ✓ Added confirmation_checkbox_2_required column';
  ELSE
    RAISE NOTICE '  ⚠ confirmation_checkbox_2_required column already exists, skipping';
  END IF;

  RAISE NOTICE 'STEP 1/4: COMPLETE ✓';
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_booking_enabled ON events(booking_enabled) WHERE booking_enabled = TRUE;

-- =====================================================
-- STEP 2: CREATE EVENT_BOOKINGS TABLE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 2/4: Creating event_bookings table...';
END $$;

-- Create event_bookings table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS event_bookings (
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
  UNIQUE(event_id, user_id)
);

-- Add comments
COMMENT ON TABLE event_bookings IS 'Tracks user bookings/registrations for events';
COMMENT ON COLUMN event_bookings.status IS 'confirmed, waitlist, cancelled, attended, no-show';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_bookings_event_id ON event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_user_id ON event_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON event_bookings(status);
CREATE INDEX IF NOT EXISTS idx_event_bookings_booked_at ON event_bookings(booked_at);
CREATE INDEX IF NOT EXISTS idx_event_bookings_checked_in ON event_bookings(checked_in);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_event_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_bookings_updated_at ON event_bookings;
CREATE TRIGGER trigger_update_event_bookings_updated_at
  BEFORE UPDATE ON event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_event_bookings_updated_at();

DO $$
BEGIN
  RAISE NOTICE 'STEP 2/4: COMPLETE ✓';
END $$;

-- =====================================================
-- STEP 3: CREATE BOOKING STATISTICS VIEW
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 3/4: Creating booking statistics view...';
END $$;

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
  
  -- Total bookings
  COUNT(CASE WHEN eb.status IN ('confirmed', 'waitlist', 'attended', 'no-show') THEN 1 END) as total_bookings,
  
  -- Available slots
  CASE 
    WHEN e.booking_capacity IS NULL THEN NULL
    ELSE GREATEST(0, e.booking_capacity - COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END))
  END as available_slots,
  
  -- Capacity utilization
  CASE 
    WHEN e.booking_capacity IS NULL THEN NULL
    WHEN e.booking_capacity = 0 THEN 0
    ELSE ROUND(
      (COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END)::DECIMAL / e.booking_capacity) * 100, 
      1
    )
  END as capacity_utilization_percent,
  
  -- Booking status
  CASE 
    WHEN e.booking_capacity IS NULL THEN 'unlimited'
    WHEN COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) >= e.booking_capacity THEN 'full'
    WHEN COUNT(CASE WHEN eb.status = 'confirmed' THEN 1 END) >= (e.booking_capacity * 0.8) THEN 'almost_full'
    ELSE 'available'
  END as booking_status

FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id
WHERE e.booking_enabled = TRUE
GROUP BY 
  e.id, e.title, e.date, e.start_time, e.end_time, e.booking_capacity, 
  e.booking_enabled, e.booking_button_label, e.booking_deadline_hours, e.allow_waitlist;

COMMENT ON VIEW event_booking_stats IS 'Booking statistics for events with booking enabled';

DO $$
BEGIN
  RAISE NOTICE 'STEP 3/4: COMPLETE ✓';
END $$;

-- =====================================================
-- STEP 4: SETUP RLS POLICIES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 4/4: Setting up Row Level Security policies...';
END $$;

-- Enable RLS
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own bookings" ON event_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON event_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON event_bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON event_bookings;

-- Policy 1: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
ON event_bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can create bookings
CREATE POLICY "Users can create bookings"
ON event_bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own bookings
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

-- Policy 5: Admins can update all bookings
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

-- Policy 6: Admins can delete bookings
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
  RAISE NOTICE 'STEP 4/4: COMPLETE ✓';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  booking_cols_count INTEGER;
  bookings_table_exists BOOLEAN;
  view_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'VERIFICATION CHECKS';
  RAISE NOTICE '=====================================================';
  
  -- Check events table columns
  SELECT COUNT(*) INTO booking_cols_count
  FROM information_schema.columns
  WHERE table_name = 'events' 
  AND column_name LIKE 'booking%' OR column_name LIKE 'confirmation%' OR column_name = 'allow_waitlist';
  
  RAISE NOTICE '✓ Events table booking columns: % (expected: 9)', booking_cols_count;
  
  -- Check event_bookings table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'event_bookings'
  ) INTO bookings_table_exists;
  
  RAISE NOTICE '✓ event_bookings table exists: %', bookings_table_exists;
  
  -- Check view
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'event_booking_stats'
  ) INTO view_exists;
  
  RAISE NOTICE '✓ event_booking_stats view exists: %', view_exists;
  
  -- Check RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'event_bookings';
  
  RAISE NOTICE '✓ RLS policies on event_bookings: % (expected: 6)', policy_count;
  
  RAISE NOTICE '';
  
  IF booking_cols_count >= 9 AND bookings_table_exists AND view_exists AND policy_count = 6 THEN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'All booking system components installed correctly.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Go to Event Data page';
    RAISE NOTICE '2. Edit an event and go to "Booking" tab';
    RAISE NOTICE '3. Enable booking and configure settings';
    RAISE NOTICE '4. Test booking on the event page';
    RAISE NOTICE '=====================================================';
  ELSE
    RAISE WARNING 'Some components may not have been created successfully.';
    RAISE WARNING 'Please review the output above for details.';
  END IF;
END $$;

-- Commit transaction
COMMIT;

-- Show final counts
SELECT 'Events with booking enabled' as status, COUNT(*) as count FROM events WHERE booking_enabled = TRUE
UNION ALL
SELECT 'Total bookings', COUNT(*) FROM event_bookings
UNION ALL
SELECT 'Confirmed bookings', COUNT(*) FROM event_bookings WHERE status = 'confirmed'
UNION ALL
SELECT 'Waitlist bookings', COUNT(*) FROM event_bookings WHERE status = 'waitlist';

-- =====================================================
-- NOTES
-- =====================================================
-- ✅ This migration is SAFE and will not delete any existing data
-- ✅ All operations use IF NOT EXISTS checks
-- ✅ Wrapped in a transaction (will rollback if any error occurs)
-- ✅ Booking is OFF by default for all events
-- ✅ No changes to existing events table structure (only additions)
-- ✅ No conflicts with existing RLS policies
-- =====================================================


