-- =====================================================
-- CHECK FILE_REQUESTS TABLE COLUMNS
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'file_requests' 
  AND table_schema = 'public'
ORDER BY ordinal_position;



