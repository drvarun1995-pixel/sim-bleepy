-- ============================================================================
-- CREATE CERTIFICATES STORAGE BUCKET
-- ============================================================================
-- This script creates the certificates storage bucket and RLS policies
-- ============================================================================

-- Note: Storage buckets cannot be created via SQL
-- You need to create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage section
-- 2. Create new bucket named "certificates"
-- 3. Set it to Private
-- 4. Add the RLS policies below

-- Storage RLS Policies (run these after creating the bucket in Dashboard)

-- Policy 1: Users can view their own certificates
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy 2: Staff can view all certificates
CREATE POLICY "Staff can view all certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
  )
);

-- Policy 3: Staff can upload certificates
CREATE POLICY "Staff can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('admin', 'meded_team', 'ctf')
  )
);

-- Policy 4: Staff can update certificates
CREATE POLICY "Staff can update certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('admin', 'meded_team', 'ctf')
  )
)
WITH CHECK (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('admin', 'meded_team', 'ctf')
  )
);

-- Policy 5: Admins can delete certificates
CREATE POLICY "Admins can delete certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role = 'admin'
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Storage RLS Policies Created!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'IMPORTANT: You still need to create the storage bucket manually:';
  RAISE NOTICE '1. Go to Supabase Dashboard → Storage';
  RAISE NOTICE '2. Create bucket named "certificates"';
  RAISE NOTICE '3. Set it to Private';
  RAISE NOTICE '4. These policies will then be active';
  RAISE NOTICE '========================================';
END $$;









