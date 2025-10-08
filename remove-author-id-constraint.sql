-- =====================================================
-- REMOVE AUTHOR_ID FOREIGN KEY CONSTRAINT
-- =====================================================
-- This removes the foreign key constraint on author_id
-- and makes it nullable since we only need author_name

-- Drop the foreign key constraint
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_author_id_fkey;

-- Make author_id nullable (in case it's not already)
ALTER TABLE public.events 
ALTER COLUMN author_id DROP NOT NULL;

-- Verify the change
SELECT 
    table_name,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'events' 
    AND column_name IN ('author_id', 'author_name')
ORDER BY column_name;

-- You should see author_id with is_nullable = 'YES'































