-- Check if request tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('file_requests', 'teaching_requests');

-- Check table structure if they exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'teaching_requests'
ORDER BY ordinal_position;
