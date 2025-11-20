-- Update teaching_portfolio_files table to include new evidence types
-- Add the following new evidence types:
-- 1. Feedback (feedback)
-- 2. Reflection (reflection)
--
-- This supports ARCP-compliant teaching portfolio requirements

-- First, drop the existing CHECK constraint
ALTER TABLE public.teaching_portfolio_files 
DROP CONSTRAINT IF EXISTS teaching_portfolio_files_evidence_type_check;

-- Add the new CHECK constraint with all evidence types
ALTER TABLE public.teaching_portfolio_files 
ADD CONSTRAINT teaching_portfolio_files_evidence_type_check 
CHECK (evidence_type IN (
  'email',
  'certificate',
  'document',
  'feedback',
  'reflection',
  'other'
));

-- Update the table comment to reflect all evidence types
COMMENT ON COLUMN public.teaching_portfolio_files.evidence_type IS 'Type of evidence: email, certificate, document, feedback, reflection, other';

