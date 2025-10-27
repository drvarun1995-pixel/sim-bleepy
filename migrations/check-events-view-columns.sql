-- =====================================================
-- CHECK EVENTS_WITH_DETAILS VIEW COLUMNS
-- =====================================================
-- This script checks what columns the view has
-- =====================================================

-- Get all columns from the view
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'events_with_details'
ORDER BY ordinal_position;

-- Get a sample event with all columns to see what data looks like
SELECT *
FROM events_with_details 
LIMIT 1;



