-- ============================================================================
-- CHECK COLUMNS IN EVENTS_WITH_DETAILS VIEW
-- ============================================================================
-- This script checks what columns are available in the events_with_details view
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checking columns in events_with_details view';
  RAISE NOTICE '========================================';
END $$;

-- Check columns in the events_with_details view
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
  AND table_schema = 'public'
  AND column_name LIKE '%feedback%'
ORDER BY column_name;

-- Also check for other related columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'events_with_details' 
  AND table_schema = 'public'
  AND column_name IN ('qr_attendance_enabled', 'feedback_enabled', 'booking_enabled', 'feedback_required_for_certificate')
ORDER BY column_name;

-- Show the view definition
SELECT definition 
FROM pg_views 
WHERE viewname = 'events_with_details' 
  AND schemaname = 'public';

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Check complete!';
  RAISE NOTICE 'If feedback_enabled is missing from the view, that is the issue.';
  RAISE NOTICE '========================================';
END $$;
