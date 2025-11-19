-- Setup storage bucket and RLS policies for email signature images
-- Note: The bucket 'email-files' should already exist from admin email images
-- 
-- IMPORTANT: Storage policies cannot be created via SQL migrations due to permissions.
-- You must create these policies manually through the Supabase Dashboard:
-- 
-- 1. Go to Supabase Dashboard → Storage → email-files bucket → Policies
-- 2. Click "New Policy" for each policy below
-- 3. Copy and paste the policy SQL from the comments below
--
-- Alternatively, you can use the Supabase Management API or create policies
-- programmatically with the service role key.

-- ============================================================================
-- POLICY 1: Allow users to upload their own signature images
-- ============================================================================
-- Policy Name: "Users can upload own signature images"
-- Operation: INSERT
-- Target Roles: authenticated
-- 
-- SQL to paste in Supabase Dashboard:
/*
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
*/

-- ============================================================================
-- POLICY 2: Allow users to view signature images
-- ============================================================================
-- Policy Name: "Users can view own signature images"
-- Operation: SELECT
-- Target Roles: authenticated
--
-- SQL to paste in Supabase Dashboard:
/*
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
*/

-- ============================================================================
-- POLICY 3: Allow users to delete their own signature images
-- ============================================================================
-- Policy Name: "Users can delete own signature images"
-- Operation: DELETE
-- Target Roles: authenticated
--
-- SQL to paste in Supabase Dashboard:
/*
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
*/

-- Note: This migration file serves as documentation.
-- The actual policies must be created through the Supabase Dashboard UI.

