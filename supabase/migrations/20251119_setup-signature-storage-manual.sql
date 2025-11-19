-- Manual Storage Policies for Email Signature Images
-- 
-- These policies must be created through the Supabase Dashboard:
-- Storage → email-files bucket → Policies → New Policy
--
-- Copy each policy SQL below and paste it in the Supabase Dashboard

-- ============================================================================
-- POLICY 1: Allow users to upload their own signature images
-- ============================================================================
CREATE POLICY "Users can upload own signature images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-files' 
  AND (storage.foldername(name))[1] = 'email-signatures'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.id::text = (storage.foldername(name))[2]
    AND users.role IN ('admin', 'meded_team')
  )
);

-- ============================================================================
-- POLICY 2: Allow users to view signature images
-- ============================================================================
CREATE POLICY "Users can view own signature images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'email-files' 
  AND (storage.foldername(name))[1] = 'email-signatures'
  AND (
    -- Users can view their own images
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.id::text = (storage.foldername(name))[2]
    )
    OR
    -- Users with email access can view any signature images (for email sending)
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team')
    )
  )
);

-- ============================================================================
-- POLICY 3: Allow users to delete their own signature images
-- ============================================================================
CREATE POLICY "Users can delete own signature images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-files' 
  AND (storage.foldername(name))[1] = 'email-signatures'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.id::text = (storage.foldername(name))[2]
    AND users.role IN ('admin', 'meded_team')
  )
);

