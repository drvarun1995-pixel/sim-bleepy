-- Debug script to check test event categories and user profile filtering
-- This will help us understand why the test event isn't showing up for UCL Year 6

-- 1. Check the test event and its categories
SELECT 
    e.id,
    e.title,
    e.date,
    e.status,
    -- Get all categories assigned to this event
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', c.id, 'name', c.name, 'color', c.color))
     FROM event_categories ec
     JOIN categories c ON ec.category_id = c.id
     WHERE ec.event_id = e.id) as assigned_categories
FROM events e
WHERE e.title ILIKE '%test%'
ORDER BY e.created_at DESC;

-- 2. Check all categories in the system
SELECT id, name, color, parent
FROM categories
ORDER BY parent NULLS FIRST, name;

-- 3. Check what categories a UCL Year 6 user should see
-- Based on the filtering logic, UCL Year 6 should see:
-- - UCL (parent category)
-- - UCL Year 6 (specific year)
-- - Any general/universal categories

-- 4. Check if there are any events with UCL Year 6 category
SELECT 
    e.id,
    e.title,
    e.date,
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', c.id, 'name', c.name, 'color', c.color))
     FROM event_categories ec
     JOIN categories c ON ec.category_id = c.id
     WHERE ec.event_id = e.id) as assigned_categories
FROM events e
WHERE EXISTS (
    SELECT 1 FROM event_categories ec
    JOIN categories c ON ec.category_id = c.id
    WHERE ec.event_id = e.id 
    AND c.name ILIKE '%UCL%'
)
ORDER BY e.date DESC
LIMIT 5;



