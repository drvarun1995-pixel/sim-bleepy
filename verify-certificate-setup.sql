-- ============================================================================
-- VERIFY CERTIFICATE SYSTEM SETUP
-- ============================================================================
-- This script verifies that all certificate system components are properly set up
-- ============================================================================

-- Check if certificates table exists and has data
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') 
    THEN '✅ Certificates table exists'
    ELSE '❌ Certificates table missing - run run-certificate-migrations.sql'
  END as certificates_table_status;

-- Check if certificate_templates table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificate_templates') 
    THEN '✅ Certificate templates table exists'
    ELSE '❌ Certificate templates table missing - run run-certificate-migrations.sql'
  END as templates_table_status;

-- Check if RLS is enabled on certificates table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('certificates', 'certificate_templates');

-- Check RLS policies on certificates table
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'certificates';

-- Check RLS policies on certificate_templates table
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'certificate_templates';

-- Test that we can query the tables (should return empty results, not errors)
SELECT 
  'Certificates table test' as test,
  COUNT(*) as row_count
FROM certificates;

SELECT 
  'Certificate templates table test' as test,
  COUNT(*) as row_count
FROM certificate_templates;

-- Check if event_bookings table has the booking we need
SELECT 
  'Event bookings test' as test,
  COUNT(*) as booking_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Bookings available for certificate generation'
    ELSE '❌ No bookings found - need sample data'
  END as status
FROM event_bookings 
WHERE event_id = '281fef32-611a-4dcc-acab-e1994e822a80';









