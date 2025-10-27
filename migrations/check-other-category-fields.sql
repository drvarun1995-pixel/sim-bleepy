-- Check if there are other category fields in events table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND (column_name LIKE '%category%' OR column_name LIKE '%other%')
ORDER BY ordinal_position;



