-- Fix RLS policies for certificates storage bucket to allow template image uploads
-- This allows authenticated users to upload template images

-- First, let's check what policies exist on the certificates bucket
-- (You can run this to see current policies)
-- SELECT * FROM storage.policies WHERE bucket_id = 'certificates';

-- Drop existing policies that might be blocking uploads
DROP POLICY IF EXISTS "Allow authenticated users to upload certificate files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload template images" ON storage.objects;

-- Create a policy to allow authenticated users to upload template images
CREATE POLICY "Allow authenticated users to upload template images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'certificates' 
  AND auth.role() = 'authenticated'
  AND starts_with(name, 'template-images/')
);

-- Create a policy to allow authenticated users to view template images
CREATE POLICY "Allow authenticated users to view template images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'certificates' 
  AND auth.role() = 'authenticated'
  AND starts_with(name, 'template-images/')
);

-- Create a policy to allow authenticated users to update their own template images
CREATE POLICY "Allow authenticated users to update template images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'certificates' 
  AND auth.role() = 'authenticated'
  AND starts_with(name, 'template-images/')
);

-- Create a policy to allow authenticated users to delete template images
CREATE POLICY "Allow authenticated users to delete template images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'certificates' 
  AND auth.role() = 'authenticated'
  AND starts_with(name, 'template-images/')
);

-- Also ensure the certificates bucket exists and has RLS enabled
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates', 
  'certificates', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;







