-- =====================================================
-- FIX MAIN ORGANIZER DELETION - ALLOW NULL
-- =====================================================
-- This script makes the organizer_id field nullable in the events table
-- Run this in your Supabase SQL Editor

-- Step 1: Check current constraint
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'organizer_id';

-- Step 2: Make organizer_id nullable (allow NULL values)
ALTER TABLE public.events 
ALTER COLUMN organizer_id DROP NOT NULL;

-- Step 3: Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'organizer_id';

-- Expected result: is_nullable should now be 'YES'

-- Step 4: Test setting organizer_id to NULL
-- (Optional - uncomment if you want to test)
-- UPDATE events SET organizer_id = NULL WHERE id = 'some-event-id';
-- SELECT id, title, organizer_id FROM events WHERE id = 'some-event-id';

-- =====================================================
-- EXPLANATION:
-- =====================================================
-- The organizer_id field in the events table was likely set as NOT NULL,
-- which prevented deleting the main organizer.
-- 
-- This script removes that constraint, allowing events to exist without
-- a main organizer (organizer_id can be NULL).
--
-- The "Other Organizers" junction table (event_organizers) was already
-- working correctly - this only fixes the main organizer field.
-- =====================================================



































