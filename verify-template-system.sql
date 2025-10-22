-- ============================================================================
-- VERIFY CERTIFICATE TEMPLATE SYSTEM
-- ============================================================================
-- This script checks if templates are being saved and shows where they are
-- ============================================================================

-- 1. Check if certificate_templates table exists
SELECT 
  'Table Exists' as status,
  count(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'certificate_templates';

-- 2. Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'certificate_templates'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'certificate_templates';

-- 4. List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'certificate_templates';

-- 5. Check if any templates exist
SELECT 
  count(*) as total_templates,
  count(DISTINCT created_by) as unique_creators
FROM certificate_templates;

-- 6. Show all templates (if any)
SELECT 
  id,
  name,
  created_by,
  created_at,
  LENGTH(background_image) as image_size_bytes,
  jsonb_array_length(fields) as field_count
FROM certificate_templates
ORDER BY created_at DESC
LIMIT 10;

-- 7. Show your user ID (for reference)
SELECT 
  id as your_user_id,
  email,
  role
FROM users 
WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
   OR id = auth.uid()
LIMIT 1;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Template System Verification Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Location: Supabase Dashboard > Table Editor > certificate_templates';
  RAISE NOTICE 'Or run: SELECT * FROM certificate_templates;';
  RAISE NOTICE '========================================';
END $$;










