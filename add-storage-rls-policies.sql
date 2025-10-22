-- ============================================================================
-- ADD STORAGE RLS POLICIES FOR CERTIFICATES BUCKET
-- ============================================================================
-- This script adds RLS policies to the existing certificates storage bucket
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view all certificates" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete certificates" ON storage.objects;

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
  RAISE NOTICE '✅ Storage RLS Policies Added!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Storage bucket "certificates" is now properly secured';
  RAISE NOTICE 'You can now test certificate generation!';
  RAISE NOTICE '========================================';
END $$;








