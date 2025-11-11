-- Add time_limit column to quiz_practice_sessions table
-- This allows users to choose their time limit per question (30, 45, 60, 75, 90 seconds)

ALTER TABLE quiz_practice_sessions
ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 60 CHECK (time_limit IN (30, 45, 60, 75, 90));

-- Add comment for documentation
COMMENT ON COLUMN quiz_practice_sessions.time_limit IS 'Time limit per question in seconds. Must be one of: 30, 45, 60, 75, 90. Default is 60 seconds.';

