-- Check if certificate system migrations have been run

-- Check if certificates table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') 
    THEN '✅ Certificates table exists'
    ELSE '❌ Certificates table missing'
  END as certificates_table_status;

-- Check if certificate_templates table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificate_templates') 
    THEN '✅ Certificate templates table exists'
    ELSE '❌ Certificate templates table missing'
  END as templates_table_status;

-- Check if storage bucket exists (this requires checking storage, not SQL)
SELECT 
  'Please check Storage section in Supabase Dashboard for "certificates" bucket' as storage_check;









