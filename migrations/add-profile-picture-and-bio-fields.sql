-- Add profile picture and bio fields to users table
-- Run this SQL in your Supabase SQL editor

-- Add profile picture columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS tagline VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN users.profile_picture_url IS 'URL to user profile picture in Supabase Storage';
COMMENT ON COLUMN users.profile_picture_updated_at IS 'Timestamp of last profile picture update';
COMMENT ON COLUMN users.about_me IS 'User bio/about me section (optional)';
COMMENT ON COLUMN users.tagline IS 'Short tagline/headline for user profile (optional, max 255 chars)';

-- Create index for faster profile picture lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_picture_url ON users(profile_picture_url) WHERE profile_picture_url IS NOT NULL;


