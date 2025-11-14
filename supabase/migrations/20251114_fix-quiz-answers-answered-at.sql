-- Fix answered_at defaults so pre-populated rows don't look like real submissions

-- Remove DEFAULT NOW() so new rows start with NULL answered_at
ALTER TABLE IF EXISTS quiz_challenge_answers
  ALTER COLUMN answered_at DROP DEFAULT;

ALTER TABLE IF EXISTS quiz_practice_answers
  ALTER COLUMN answered_at DROP DEFAULT;

-- Clean up existing placeholder rows where answered_at was auto-populated
UPDATE quiz_challenge_answers
SET answered_at = NULL
WHERE answered_at IS NOT NULL
  AND (selected_answer IS NULL OR selected_answer = '')
  AND points_earned IS NULL
  AND time_taken_seconds IS NULL
  AND is_correct IS NULL;

UPDATE quiz_practice_answers
SET answered_at = NULL
WHERE answered_at IS NOT NULL
  AND (selected_answer IS NULL OR selected_answer = '')
  AND points_earned IS NULL
  AND time_taken_seconds IS NULL
  AND is_correct IS NULL;

