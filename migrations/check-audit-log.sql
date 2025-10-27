-- Check if there's any audit log or way to see what was deleted

-- 1. Check if there's an audit log table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%audit%' OR table_name LIKE '%log%';

-- 2. Check if there are any deleted events in a soft delete system
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%deleted%' OR table_name LIKE '%archive%';

-- 3. Check the events table structure to see if there's a deleted_at column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND (column_name LIKE '%deleted%' OR column_name LIKE '%archive%');

-- 4. Check if there are any events that might have been moved to a different status
SELECT 
    id,
    title,
    date,
    status,
    created_at
FROM events
WHERE status = 'draft' OR status = 'cancelled'
ORDER BY created_at DESC
LIMIT 10;



