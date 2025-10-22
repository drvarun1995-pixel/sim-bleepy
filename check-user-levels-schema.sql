-- Check the actual schema of user_levels table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_levels'
ORDER BY ordinal_position;







