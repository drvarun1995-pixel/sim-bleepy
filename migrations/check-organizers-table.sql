-- =====================================================
-- CHECK ORGANIZERS TABLE STRUCTURE
-- =====================================================
-- Run this to see what columns actually exist in the organizers table
-- =====================================================

-- Check organizers table columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'organizers' 
ORDER BY ordinal_position;

-- Sample organizer data
SELECT * FROM organizers LIMIT 3;

