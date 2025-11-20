-- Update teaching_portfolio_files table to include new categories
-- This migration includes all categories for ARCP-aligned teaching portfolio:
-- Professional Skills, Professional Values, Professional Knowledge, 
-- Health Promotion, and Patient Safety domains

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
  'public-health-teaching',
  'prevention-strategies',
  'qi-projects',
  'audit-projects',
  'patient-safety-training',
  'communication-skills-training',
  'professionalism-workshops',
  'team-working-sessions',
  'mdt-participation',
  'mentoring-activities',
  'ethics-training',
  -- Professional Knowledge categories
  'medical-knowledge-sessions',
  'evidence-based-practice-workshops',
  'journal-club-participation',
  'case-presentations',
  'research-activities',
  'clinical-reasoning-sessions',
  -- Health Promotion additional categories
  'health-education-sessions',
  'screening-program-teaching',
  'lifestyle-medicine-teaching',
  'community-health-initiatives',
  'vaccination-program-teaching',
  -- Patient Safety additional categories
  'incident-reporting-training',
  'root-cause-analysis',
  'clinical-governance-participation',
  'risk-management-training',
  'morbidity-mortality-meetings',
  'others'
));

-- Update the table comment to reflect all categories
COMMENT ON COLUMN public.teaching_portfolio_files.category IS 'Teaching category: bedside-teaching, twilight-teaching, core-teaching, osce-skills-teaching, exams, vr-sessions, simulations, portfolio-drop-in-sessions, clinical-skills-sessions, paediatric-training-sessions, obs-gynae-training-sessions, a-e-sessions, hub-days, public-health-teaching, prevention-strategies, qi-projects, audit-projects, patient-safety-training, communication-skills-training, professionalism-workshops, team-working-sessions, mdt-participation, mentoring-activities, ethics-training, medical-knowledge-sessions, evidence-based-practice-workshops, journal-club-participation, case-presentations, research-activities, clinical-reasoning-sessions, health-education-sessions, screening-program-teaching, lifestyle-medicine-teaching, community-health-initiatives, vaccination-program-teaching, incident-reporting-training, root-cause-analysis, clinical-governance-participation, risk-management-training, morbidity-mortality-meetings, others';

