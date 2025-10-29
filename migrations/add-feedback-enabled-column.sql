-- ============================================================================
-- ADD FEEDBACK_ENABLED COLUMN TO EVENTS TABLE
-- ============================================================================
-- This migration adds the feedback_enabled column to the events table
-- to separate feedback functionality from QR Code Attendance Tracking
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Adding feedback_enabled column to events table';
  RAISE NOTICE '========================================';
END $$;

-- Add feedback_enabled column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS feedback_enabled BOOLEAN DEFAULT false;

-- Add comment for the new column
COMMENT ON COLUMN events.feedback_enabled IS 'Whether feedback collection is enabled for this event';

-- Update existing events to have feedback_enabled = true if they have QR attendance enabled
-- This maintains backward compatibility
UPDATE events 
SET feedback_enabled = true 
WHERE qr_attendance_enabled = true 
AND feedback_enabled IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_feedback_enabled ON events(feedback_enabled);

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ feedback_enabled column added successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Column added: feedback_enabled (BOOLEAN, default false)';
  RAISE NOTICE 'Index created: idx_events_feedback_enabled';
  RAISE NOTICE 'Existing events with QR attendance enabled have been updated';
  RAISE NOTICE '========================================';
END $$;
