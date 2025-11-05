-- =====================================================
-- VERIFY VIEW INCLUDES NEW COLUMNS (OPTIONAL)
-- =====================================================
-- Run this AFTER the main migration to verify the view works
-- This does NOT modify the view - it only checks if columns are accessible
-- =====================================================

-- Check if the new columns are accessible in the view
SELECT 
    'Column Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'events_with_details' 
            AND column_name = 'rescheduled_date'
        ) THEN '✅ rescheduled_date found in view'
        ELSE '❌ rescheduled_date NOT found in view'
    END as rescheduled_date_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'events_with_details' 
            AND column_name = 'moved_online_link'
        ) THEN '✅ moved_online_link found in view'
        ELSE '❌ moved_online_link NOT found in view'
    END as moved_online_link_status;

-- Test query to verify columns work (should return NULL for existing events)
SELECT 
    id,
    title,
    event_status,
    rescheduled_date,
    moved_online_link
FROM events_with_details
LIMIT 5;

-- If the above queries work, the view is fine and includes the new columns.
-- If you get errors about missing columns, the view might need to be refreshed,
-- but this should NOT happen if the view uses SELECT e.*

