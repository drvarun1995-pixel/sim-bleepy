-- Fix existing profile picture URLs to use API endpoint format
-- Run this SQL in your Supabase SQL Editor

-- Update existing profile picture URLs from direct storage URLs to API endpoint URLs
UPDATE users 
SET profile_picture_url = '/api/user/profile-picture/' || id
WHERE profile_picture_url IS NOT NULL 
  AND profile_picture_url LIKE 'https://%supabase.co/storage/v1/object/public/profile-pictures/%';

-- Verify the update
SELECT id, profile_picture_url 
FROM users 
WHERE profile_picture_url IS NOT NULL;

