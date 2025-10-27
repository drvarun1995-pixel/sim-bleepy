-- Check if anonymous_enabled column exists in feedback_forms table
-- If not, add it

-- First, check if the column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'feedback_forms' 
  AND table_schema = 'public'
  AND column_name = 'anonymous_enabled';

-- If the above query returns no rows, then add the column
ALTER TABLE feedback_forms 
ADD COLUMN IF NOT EXISTS anonymous_enabled BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN feedback_forms.anonymous_enabled IS 'Whether this feedback form allows anonymous responses (true) or requires user authentication (false)';

-- Update existing feedback forms to default to user-based (not anonymous)
UPDATE feedback_forms 
SET anonymous_enabled = false 
WHERE anonymous_enabled IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'feedback_forms' 
  AND table_schema = 'public'
  AND column_name = 'anonymous_enabled';
