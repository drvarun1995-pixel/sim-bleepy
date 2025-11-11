-- ============================================================================
-- Allow Question Deletion with Cascade
-- ============================================================================
-- This migration changes the foreign key constraint on quiz_practice_answers
-- and quiz_challenge_answers to allow cascading deletes when questions are deleted.
-- This allows admins to delete test questions even if they've been used.
-- ============================================================================

-- Drop existing foreign key constraints
ALTER TABLE quiz_practice_answers
DROP CONSTRAINT IF EXISTS quiz_practice_answers_question_id_fkey;

ALTER TABLE quiz_challenge_answers
DROP CONSTRAINT IF EXISTS quiz_challenge_answers_question_id_fkey;

-- Recreate with ON DELETE CASCADE
-- This will delete all practice/challenge answers when a question is deleted
ALTER TABLE quiz_practice_answers
ADD CONSTRAINT quiz_practice_answers_question_id_fkey
FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE;

ALTER TABLE quiz_challenge_answers
ADD CONSTRAINT quiz_challenge_answers_question_id_fkey
FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE;

-- Note: This means deleting a question will also delete all answers referencing it.
-- Session data will remain, but answers will be removed.
-- This is acceptable for test questions that need to be deleted.

