-- =====================================================
-- UPDATE RESOURCES TABLE TO USE EVENT FORMATS
-- =====================================================
-- This script updates the resources table to use the same formats as events

-- Drop the old constraint
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_category_check;

-- Add new constraint with all event formats
ALTER TABLE public.resources ADD CONSTRAINT resources_category_check 
CHECK (category IN (
  'a-e-practice-sessions',
  'bedside-teaching',
  'clinical-skills',
  'core-teachings',
  'exams-mocks',
  'grand-round',
  'hub-days',
  'inductions',
  'obs-gynae-practice-sessions',
  'osce-revision',
  'others',
  'paeds-practice-sessions',
  'pharmacy-teaching',
  'portfolio-drop-ins',
  'twilight-teaching',
  'virtual-reality-sessions'
));

-- Verify the constraint was added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.resources'::regclass
AND conname = 'resources_category_check';






