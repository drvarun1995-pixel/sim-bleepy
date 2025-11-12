-- Add time_limit column to quiz_challenges table
ALTER TABLE quiz_challenges
ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 60 CHECK (time_limit IN (30, 45, 60, 75, 90));

-- Add comment
COMMENT ON COLUMN quiz_challenges.time_limit IS 'Time limit per question in seconds. Must be one of: 30, 45, 60, 75, 90. Default is 60 seconds.';

