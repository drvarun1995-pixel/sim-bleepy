-- Check if events actually have categories assigned
SELECT 
  COUNT(*) as total_events,
  COUNT(category_id) as events_with_category_id,
  COUNT(*) - COUNT(category_id) as events_without_category_id
FROM events;



