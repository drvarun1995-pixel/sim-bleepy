-- Simple check to see what's happening with the test event

-- 1. Basic event info
SELECT 
    id,
    title,
    date,
    status,
    created_at,
    updated_at
FROM events
WHERE title ILIKE '%test%'
ORDER BY created_at DESC;

-- 2. Check if it's published
SELECT 
    id,
    title,
    status,
    CASE 
        WHEN status = 'published' THEN '✅ Published'
        ELSE '❌ Not Published'
    END as publication_status
FROM events
WHERE title ILIKE '%test%';

-- 3. Check date - is it in the future?
SELECT 
    id,
    title,
    date,
    CASE 
        WHEN date > CURRENT_DATE THEN '✅ Future Event'
        WHEN date = CURRENT_DATE THEN '⚠️ Today'
        ELSE '❌ Past Event'
    END as date_status
FROM events
WHERE title ILIKE '%test%';

-- 4. Check if it has all 12 categories
SELECT 
    e.id,
    e.title,
    COUNT(ec.category_id) as category_count,
    (SELECT COUNT(*) FROM categories) as total_categories
FROM events e
LEFT JOIN event_categories ec ON e.id = ec.event_id
WHERE e.title ILIKE '%test%'
GROUP BY e.id, e.title;

-- 5. Check booking settings (without allowed_roles)
SELECT 
    id,
    title,
    booking_enabled,
    booking_capacity,
    booking_deadline_hours,
    booking_button_label,
    approval_mode
FROM events
WHERE title ILIKE '%test%';
