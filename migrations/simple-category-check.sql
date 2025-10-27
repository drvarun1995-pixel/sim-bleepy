-- Simple check: what categories are assigned to events
SELECT 
  e.id,
  e.title,
  e.category_id,
  c.name as category_name,
  c.color as category_color
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.category_id IS NOT NULL
ORDER BY e.title
LIMIT 20;



