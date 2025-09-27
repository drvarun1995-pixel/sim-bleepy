-- Add transcript column to attempts table
ALTER TABLE attempts 
ADD COLUMN IF NOT EXISTS transcript JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN attempts.transcript IS 'Stores the conversation transcript as JSON array with role, content, and timestamp fields';
