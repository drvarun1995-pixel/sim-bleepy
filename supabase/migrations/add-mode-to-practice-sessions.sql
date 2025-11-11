-- Add mode column to quiz_practice_sessions table
-- Mode can be 'continuous' (see all answers at end) or 'paced' (see explanation after each question)

ALTER TABLE quiz_practice_sessions
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'paced' CHECK (mode IN ('continuous', 'paced'));

COMMENT ON COLUMN quiz_practice_sessions.mode IS 'Practice mode: continuous (see answers at end) or paced (see explanation after each question). Default is paced.';

