-- =====================================================
-- ADD SOFT DELETE TO EVENT BOOKINGS
-- =====================================================
-- This adds a deleted_at column for soft deletion
-- Bookings will remain visible to admins even after users delete them
-- =====================================================

BEGIN;

-- Add deleted_at column to event_bookings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_bookings' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE event_bookings ADD COLUMN deleted_at TIMESTAMPTZ;
    RAISE NOTICE '✓ Added deleted_at column to event_bookings';
  ELSE
    RAISE NOTICE '⚠ deleted_at column already exists';
  END IF;
END $$;

-- Add deleted_by column to track who deleted it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_bookings' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE event_bookings ADD COLUMN deleted_by UUID REFERENCES users(id);
    RAISE NOTICE '✓ Added deleted_by column to event_bookings';
  ELSE
    RAISE NOTICE '⚠ deleted_by column already exists';
  END IF;
END $$;

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'SOFT DELETE MIGRATION COMPLETE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'New columns added to event_bookings:';
  RAISE NOTICE '  - deleted_at: Timestamp when booking was deleted';
  RAISE NOTICE '  - deleted_by: User ID who deleted the booking';
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now soft-delete bookings';
  RAISE NOTICE 'Admins will still see deleted bookings for record-keeping';
  RAISE NOTICE '=====================================================';
END $$;

