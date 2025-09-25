-- Update users table to match the registration API requirements
-- Add missing columns to the users table

-- Add password_hash column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add auth_provider column
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';

-- Add email_verified column
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add updated_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have default values
UPDATE users 
SET 
  auth_provider = 'email',
  email_verified = TRUE,
  updated_at = created_at
WHERE auth_provider IS NULL OR email_verified IS NULL OR updated_at IS NULL;

-- Check the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if there are any users now
SELECT COUNT(*) as total_users FROM users;
SELECT id, email, name, auth_provider, email_verified, created_at FROM users LIMIT 5;
