-- ============================================================================
-- UPDATE EVENT_BOOKINGS FOR FEEDBACK SYSTEM
-- ============================================================================
-- This migration adds feedback-related columns to the event_bookings table
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updating event_bookings for feedback system';
  RAISE NOTICE '========================================';
END $$;

-- Add feedback completion columns to event_bookings
ALTER TABLE event_bookings 
ADD COLUMN IF NOT EXISTS feedback_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS feedback_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for feedback completion queries
CREATE INDEX IF NOT EXISTS idx_event_bookings_feedback_completed 
ON event_bookings(feedback_completed);

CREATE INDEX IF NOT EXISTS idx_event_bookings_feedback_completed_at 
ON event_bookings(feedback_completed_at);

-- Add comments
COMMENT ON COLUMN event_bookings.feedback_completed IS 'Whether user has completed feedback for this event';
COMMENT ON COLUMN event_bookings.feedback_completed_at IS 'When user completed feedback for this event';

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Event Bookings Updated for Feedback!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added columns:';
  RAISE NOTICE '  - feedback_completed (BOOLEAN)';
  RAISE NOTICE '  - feedback_completed_at (TIMESTAMP)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created indexes for performance';
  RAISE NOTICE '========================================';
END $$;


