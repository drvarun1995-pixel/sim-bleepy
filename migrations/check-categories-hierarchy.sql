-- Check categories and their hierarchy
SELECT 
  id,
  name,
  parent,
  color,
  created_at
FROM categories 
ORDER BY 
  CASE WHEN parent IS NULL THEN 0 ELSE 1 END,
  parent,
  name;



