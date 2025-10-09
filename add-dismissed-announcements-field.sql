-- Add dismissed_announcements field to users table
-- This will store an array of announcement IDs that the user has dismissed
-- Run this script in your Supabase SQL editor

-- Add the column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS dismissed_announcements JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the field
COMMENT ON COLUMN users.dismissed_announcements IS 'Array of announcement IDs that the user has dismissed';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_dismissed_announcements ON users USING GIN (dismissed_announcements);

-- Verify the change
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'dismissed_announcements';

