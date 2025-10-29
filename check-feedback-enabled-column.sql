-- ============================================================================
-- CHECK IF FEEDBACK_ENABLED COLUMN EXISTS IN EVENTS TABLE
-- ============================================================================
-- This script checks if the feedback_enabled column exists in the events table
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checking if feedback_enabled column exists';
  RAISE NOTICE '========================================';
END $$;

-- Check if the feedback_enabled column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND table_schema = 'public'
  AND column_name = 'feedback_enabled';

-- If no results, the column doesn't exist
-- If results exist, show the column details

-- Also check the current structure of events table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND table_schema = 'public'
  AND column_name IN ('qr_attendance_enabled', 'feedback_enabled', 'booking_enabled')
ORDER BY column_name;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Check complete!';
  RAISE NOTICE 'If you see feedback_enabled above, the column exists.';
  RAISE NOTICE 'If you dont see feedback_enabled, the column is missing.';
  RAISE NOTICE '========================================';
END $$;
