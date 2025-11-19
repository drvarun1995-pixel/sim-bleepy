-- Add date column to teaching_portfolio_files table
-- This allows users to specify the date associated with the teaching activity

ALTER TABLE public.teaching_portfolio_files 
ADD COLUMN IF NOT EXISTS activity_date DATE;

-- Add index for date queries
CREATE INDEX IF NOT EXISTS idx_teaching_portfolio_files_activity_date 
ON public.teaching_portfolio_files(activity_date);

-- Add comment
COMMENT ON COLUMN public.teaching_portfolio_files.activity_date IS 'Date of the teaching activity/event';

