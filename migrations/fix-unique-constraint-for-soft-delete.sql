-- =====================================================
-- FIX UNIQUE CONSTRAINT FOR SOFT DELETE
-- =====================================================
-- This removes the simple unique constraint and replaces it
-- with a partial unique index that only applies to non-deleted bookings
-- =====================================================

BEGIN;

-- Drop the existing unique constraint
ALTER TABLE event_bookings 
DROP CONSTRAINT IF EXISTS event_bookings_event_id_user_id_key;

-- Create a partial unique index that only applies to ACTIVE (non-cancelled, non-deleted) bookings
-- This allows users to re-book events after cancelling previous bookings
-- Multiple cancelled/deleted bookings are allowed for record-keeping
CREATE UNIQUE INDEX IF NOT EXISTS event_bookings_active_user_event_unique 
ON event_bookings (event_id, user_id) 
WHERE deleted_at IS NULL AND status NOT IN ('cancelled');

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'UNIQUE CONSTRAINT FIX COMPLETE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  - Removed: event_bookings_event_id_user_id_key constraint';
  RAISE NOTICE '  - Added: event_bookings_active_user_event_unique partial index';
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now re-book events after cancelling';
  RAISE NOTICE 'Only one ACTIVE (non-cancelled) booking per user per event';
  RAISE NOTICE 'Cancelled/deleted bookings are kept for admin record-keeping';
  RAISE NOTICE '=====================================================';
END $$;

