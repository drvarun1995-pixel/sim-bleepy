-- Update teaching_portfolio_files table to include new categories
-- Add the following new categories:
-- 1. VR Sessions (vr-sessions)
-- 2. Simulations (simulations)
-- 3. Portfolio drop in sessions (portfolio-drop-in-sessions)
-- 4. Clinical Skills sessions (clinical-skills-sessions)
-- 5. Paediatric training sessions (paediatric-training-sessions)
-- 6. Obs & Gynae training sessions (obs-gynae-training-sessions)
-- 7. A-E sessions (a-e-sessions)
-- 8. Hub days (hub-days)

-- First, drop the existing CHECK constraint
ALTER TABLE public.teaching_portfolio_files 
DROP CONSTRAINT IF EXISTS teaching_portfolio_files_category_check;

-- Add the new CHECK constraint with all categories
ALTER TABLE public.teaching_portfolio_files 
ADD CONSTRAINT teaching_portfolio_files_category_check 
CHECK (category IN (
  'bedside-teaching',
  'twilight-teaching',
  'core-teaching',
  'osce-skills-teaching',
  'exams',
  'vr-sessions',
  'simulations',
  'portfolio-drop-in-sessions',
  'clinical-skills-sessions',
  'paediatric-training-sessions',
  'obs-gynae-training-sessions',
  'a-e-sessions',
  'hub-days',
  'others'
));

-- Update the table comment to reflect all categories
COMMENT ON COLUMN public.teaching_portfolio_files.category IS 'Teaching category: bedside-teaching, twilight-teaching, core-teaching, osce-skills-teaching, exams, vr-sessions, simulations, portfolio-drop-in-sessions, clinical-skills-sessions, paediatric-training-sessions, obs-gynae-training-sessions, a-e-sessions, hub-days, others';

