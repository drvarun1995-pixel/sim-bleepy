-- Add curriculum_domain column to teaching_portfolio_files table
-- This allows direct mapping of files to ARCP curriculum domains
--
-- This supports the ARCP-compliant teaching portfolio feature

ALTER TABLE public.teaching_portfolio_files 
ADD COLUMN IF NOT EXISTS curriculum_domain TEXT;

-- Add CHECK constraint for valid curriculum domains
ALTER TABLE public.teaching_portfolio_files 
DROP CONSTRAINT IF EXISTS teaching_portfolio_files_curriculum_domain_check;

ALTER TABLE public.teaching_portfolio_files 
ADD CONSTRAINT teaching_portfolio_files_curriculum_domain_check 
CHECK (curriculum_domain IS NULL OR curriculum_domain IN (
  'professional-values',
  'professional-skills',
  'professional-knowledge',
  'health-promotion',
  'patient-safety'
));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_teaching_portfolio_files_curriculum_domain 
ON public.teaching_portfolio_files(curriculum_domain);

-- Add comment
COMMENT ON COLUMN public.teaching_portfolio_files.curriculum_domain IS 'ARCP curriculum domain: professional-values, professional-skills, professional-knowledge, health-promotion, patient-safety';

-- Note: This column is nullable to support legacy files that were uploaded before this feature
-- New uploads will always have a curriculum_domain set

