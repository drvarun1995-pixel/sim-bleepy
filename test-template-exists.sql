-- Test if template files exist in storage
-- Run this in Supabase SQL Editor to check storage contents

-- Check if certificates bucket exists
SELECT * FROM storage.buckets WHERE name = 'certificates';

-- List all files in template-images folder
-- Note: This requires storage admin access
-- You can also check this in Supabase Dashboard > Storage > certificates bucket

