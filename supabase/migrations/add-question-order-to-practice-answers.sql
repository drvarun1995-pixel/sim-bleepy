-- Migration: Add question_order column to quiz_practice_answers table
-- This migration safely adds the question_order column if it doesn't exist

-- Add question_order column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'quiz_practice_answers' 
        AND column_name = 'question_order'
    ) THEN
        ALTER TABLE quiz_practice_answers 
        ADD COLUMN question_order INTEGER;
        
        -- Update existing rows to have question_order based on answered_at or creation order
        -- For rows with answered_at, use that order
        UPDATE quiz_practice_answers qpa1
        SET question_order = (
            SELECT COUNT(*) + 1
            FROM quiz_practice_answers qpa2
            WHERE qpa2.session_id = qpa1.session_id
            AND (
                qpa2.answered_at < qpa1.answered_at
                OR (qpa2.answered_at = qpa1.answered_at AND qpa2.id < qpa1.id)
            )
        )
        WHERE question_order IS NULL;
        
        -- For rows without answered_at (pre-populated questions), order by id
        UPDATE quiz_practice_answers
        SET question_order = sub.row_num
        FROM (
            SELECT 
                id,
                ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY id) as row_num
            FROM quiz_practice_answers
            WHERE question_order IS NULL
        ) sub
        WHERE quiz_practice_answers.id = sub.id;
        
        RAISE NOTICE 'Added question_order column to quiz_practice_answers table';
    ELSE
        RAISE NOTICE 'question_order column already exists in quiz_practice_answers table';
    END IF;
END $$;

