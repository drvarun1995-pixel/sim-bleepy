-- =====================================================
-- CHECK EVENT_BOOKINGS TABLE STRUCTURE
-- =====================================================
-- This script checks what actually exists in the event_bookings table
-- =====================================================

-- Check if event_bookings table exists
SELECT 
  'Table Exists' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_bookings') 
    THEN '✅ EXISTS' 
    ELSE '❌ DOES NOT EXIST' 
  END as status;

-- Check all columns in event_bookings table (if it exists)
SELECT 
  'Columns' as check_type,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'event_bookings'
ORDER BY ordinal_position;

-- Check if there are any rows
SELECT 
  'Row Count' as check_type,
  COUNT(*) as count
FROM event_bookings;

-- Check indexes on event_bookings
SELECT 
  'Indexes' as check_type,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'event_bookings';

-- Check RLS status
SELECT 
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'event_bookings';



