-- Create storage bucket for IMT Portfolio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'IMT Portfolio',
  'IMT Portfolio',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for IMT Portfolio files
-- Users can only access their own files
CREATE POLICY "Users can view their own IMT portfolio files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'IMT Portfolio' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Users can upload their own files
CREATE POLICY "Users can upload their own IMT portfolio files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'IMT Portfolio' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Users can update their own files
CREATE POLICY "Users can update their own IMT portfolio files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'IMT Portfolio' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Users can delete their own files
CREATE POLICY "Users can delete their own IMT portfolio files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'IMT Portfolio' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );
