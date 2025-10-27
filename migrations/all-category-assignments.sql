-- Show ALL category assignments to events
SELECT 
  e.id,
  e.title,
  e.category_id,
  c.name as category_name,
  c.color as category_color
FROM events e
LEFT JOIN categories c ON e.category_id = c.id
ORDER BY e.title;



