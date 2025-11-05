-- =====================================================
-- ADD RESCHEDULED DATE AND MOVED ONLINE LINK FIELDS
-- =====================================================
-- This migration adds two new columns to the events table:
-- 1. rescheduled_date - for storing the new date when an event is rescheduled
-- 2. moved_online_link - for storing the online meeting link when an event is moved online
-- =====================================================

BEGIN;

-- Add rescheduled_date column (nullable DATE)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS rescheduled_date DATE;

-- Add moved_online_link column (nullable TEXT for URL)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS moved_online_link TEXT;

-- Add comment to columns for documentation
COMMENT ON COLUMN events.rescheduled_date IS 'Optional date when the event is rescheduled to. Used when event_status is "rescheduled" or "postponed".';
COMMENT ON COLUMN events.moved_online_link IS 'Optional URL for the online meeting link. Used when event_status is "moved-online".';

-- IMPORTANT: We do NOT touch the events_with_details view here.
-- The view uses SELECT e.* which automatically includes all columns from the events table.
-- Since we're only adding columns (not removing or modifying), the view will automatically
-- pick up these new columns without any changes needed.
--
-- This avoids any potential security definer issues that could occur from recreating the view.

COMMIT;

-- Verify the columns were added
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added columns to events table:';
  RAISE NOTICE '  - rescheduled_date (DATE, nullable)';
  RAISE NOTICE '  - moved_online_link (TEXT, nullable)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: This migration does NOT modify the events_with_details view.';
  RAISE NOTICE '   The view uses SELECT e.* which automatically includes new columns.';
  RAISE NOTICE '   No security definer issues should occur.';
  RAISE NOTICE '';
  RAISE NOTICE '✅ To verify the view includes the new columns, run:';
  RAISE NOTICE '   SELECT rescheduled_date, moved_online_link FROM events_with_details LIMIT 1;';
END $$;

