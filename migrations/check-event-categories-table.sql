-- Check the event_categories junction table
SELECT 
  event_id,
  category_id,
  c.name as category_name,
  c.color as category_color
FROM event_categories ec
LEFT JOIN categories c ON ec.category_id = c.id
ORDER BY event_id
LIMIT 20;



