-- Add 'used' column to password_reset_tokens table
-- This is needed for the password reset functionality

-- Add the 'used' column to track if a token has been used
ALTER TABLE password_reset_tokens 
ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT false;

-- Create index for better performance on used column
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used);

-- Update any existing tokens to be marked as not used (if they exist)
UPDATE password_reset_tokens 
SET used = false 
WHERE used IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'password_reset_tokens' 
AND column_name = 'used';
