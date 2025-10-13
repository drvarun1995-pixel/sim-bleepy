-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own IMT portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own IMT portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own IMT portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own IMT portfolio files" ON storage.objects;

-- Create storage policies for IMT Portfolio files with correct bucket name
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
