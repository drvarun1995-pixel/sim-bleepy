-- Check if there are junction tables for multiple categories
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%event%category%' 
   OR table_name LIKE '%category%event%'
   OR table_name LIKE '%event_categories%';



