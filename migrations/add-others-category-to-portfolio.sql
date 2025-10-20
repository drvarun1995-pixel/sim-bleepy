-- Add 'others' category to portfolio_files table
-- Run this SQL in your Supabase SQL editor

-- Add custom_subsection and custom_evidence_type columns if they don't exist
ALTER TABLE portfolio_files 
ADD COLUMN IF NOT EXISTS custom_subsection TEXT,
ADD COLUMN IF NOT EXISTS custom_evidence_type TEXT;

-- Drop the existing check constraint
ALTER TABLE portfolio_files 
DROP CONSTRAINT IF EXISTS portfolio_files_category_check;

-- Add the new check constraint with 'others' included
ALTER TABLE portfolio_files 
ADD CONSTRAINT portfolio_files_category_check 
CHECK (category IN ('postgraduate', 'presentations', 'publications', 'teaching-experience', 'training-in-teaching', 'qi', 'others'));

