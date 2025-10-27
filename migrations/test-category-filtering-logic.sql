-- Test the category filtering logic for events with multiple categories
-- This will help us understand why events with all categories aren't showing up

-- 1. First, let's see what categories exist and their hierarchy
SELECT 
    id, 
    name, 
    color, 
    parent,
    CASE 
        WHEN parent IS NULL THEN 'Parent Category'
        ELSE 'Child Category'
    END as category_type
FROM categories
ORDER BY parent NULLS FIRST, name;

-- 2. Check if there are any events with multiple category types (UCL + Foundation Year)
SELECT 
    e.id,
    e.title,
    e.date,
    -- Count categories by type
    (SELECT COUNT(*) FROM event_categories ec
     JOIN categories c ON ec.category_id = c.id
     WHERE ec.event_id = e.id AND c.name ILIKE '%UCL%') as ucl_categories,
    (SELECT COUNT(*) FROM event_categories ec
     JOIN categories c ON ec.category_id = c.id
     WHERE ec.event_id = e.id AND c.name ILIKE '%Foundation%') as foundation_categories,
    (SELECT COUNT(*) FROM event_categories ec
     JOIN categories c ON ec.category_id = c.id
     WHERE ec.event_id = e.id AND c.name ILIKE '%ARU%') as aru_categories,
    -- Total categories
    (SELECT COUNT(*) FROM event_categories ec WHERE ec.event_id = e.id) as total_categories
FROM events e
WHERE EXISTS (
    SELECT 1 FROM event_categories ec
    JOIN categories c ON ec.category_id = c.id
    WHERE ec.event_id = e.id
)
ORDER BY total_categories DESC, e.date DESC
LIMIT 10;

-- 3. Check specifically for the test event
SELECT 
    e.id,
    e.title,
    e.date,
    e.status,
    -- Get all categories for this event
    (SELECT JSON_AGG(JSON_BUILD_OBJECT(
        'id', c.id, 
        'name', c.name, 
        'color', c.color,
        'parent', c.parent
    ))
     FROM event_categories ec
     JOIN categories c ON ec.category_id = c.id
     WHERE ec.event_id = e.id
     ORDER BY c.parent NULLS FIRST, c.name) as all_categories
FROM events e
WHERE e.title ILIKE '%test%'
ORDER BY e.created_at DESC;



