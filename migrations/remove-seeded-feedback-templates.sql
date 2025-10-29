-- ============================================================================
-- REMOVE SEEDED FEEDBACK TEMPLATES
-- ============================================================================
-- This migration removes the hardcoded system templates that were seeded
-- during the initial feedback templates system creation
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Removing Seeded Feedback Templates';
  RAISE NOTICE '========================================';
END $$;

-- Delete the seeded system templates
DELETE FROM feedback_templates 
WHERE is_system_template = true 
AND name IN (
  'Basic Event Feedback',
  'Workshop Evaluation', 
  'Seminar Assessment',
  'Clinical Skills Training'
);

-- Get count of remaining templates
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count FROM feedback_templates;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Seeded templates removed successfully!';
  RAISE NOTICE 'Remaining templates: %', remaining_count;
  RAISE NOTICE '========================================';
END $$;
