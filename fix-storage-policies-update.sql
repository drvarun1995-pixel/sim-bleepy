-- Fix storage policies for IMT Portfolio bucket
-- This updates existing policies to use the correct bucket ID

-- Drop existing policies with old bucket ID
DROP POLICY IF EXISTS "Users can view their own IMT portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own IMT portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own IMT portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own IMT portfolio files" ON storage.objects;

-- Create new policies with correct bucket ID
CREATE POLICY "Users can view their own IMT portfolio files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'IMT Portfolio' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can upload their own IMT portfolio files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'IMT Portfolio' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can update their own IMT portfolio files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'IMT Portfolio' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can delete their own IMT portfolio files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'IMT Portfolio' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );









