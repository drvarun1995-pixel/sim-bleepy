-- Create Supabase Storage bucket for profile pictures
-- Run this SQL in your Supabase SQL editor

-- Note: Storage buckets are typically created via Supabase Dashboard or API
-- This file documents the configuration needed

/*
===========================================
SUPABASE STORAGE BUCKET SETUP INSTRUCTIONS
===========================================

1. Go to Supabase Dashboard > Storage
2. Click "Create bucket"
3. Use these settings:
   - Name: profile-pictures
   - Public bucket: Yes (allows public read access)
   - File size limit: 3MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

4. After creating the bucket, set up the following RLS policies:
*/

-- ============================================
-- STORAGE RLS POLICIES (Run in SQL Editor)
-- ============================================

-- Policy 1: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow public read access to all profile pictures
CREATE POLICY "Public read access to profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- ============================================
-- ALTERNATIVE: CREATE BUCKET VIA SQL (if supported)
-- ============================================

-- Insert bucket configuration (may require storage.buckets table access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  3145728, -- 3MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

