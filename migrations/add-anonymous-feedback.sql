-- Add anonymous_enabled column to feedback_forms table
-- This allows feedback forms to be configured for anonymous or user-based responses

ALTER TABLE feedback_forms 
ADD COLUMN IF NOT EXISTS anonymous_enabled BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN feedback_forms.anonymous_enabled IS 'Whether this feedback form allows anonymous responses (true) or requires user authentication (false)';

-- Update existing feedback forms to default to user-based (not anonymous)
UPDATE feedback_forms 
SET anonymous_enabled = false 
WHERE anonymous_enabled IS NULL;