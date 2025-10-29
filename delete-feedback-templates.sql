-- ============================================================================
-- DELETE SEEDED FEEDBACK TEMPLATES
-- ============================================================================
-- This script deletes the hardcoded system templates that were seeded
-- during the initial feedback templates system creation
-- ============================================================================

DO $$
DECLARE
    template_count INTEGER;
    deleted_count INTEGER;
BEGIN
    -- First, check how many seeded templates exist
    SELECT COUNT(*) INTO template_count
    FROM feedback_templates
    WHERE is_system_template = true 
    AND name IN (
        'Basic Event Feedback',
        'Workshop Evaluation', 
        'Seminar Assessment',
        'Clinical Skills Training'
    );
    
    RAISE NOTICE 'Found % seeded templates to delete', template_count;
    
    -- Delete the seeded system templates
    DELETE FROM feedback_templates 
    WHERE is_system_template = true 
    AND name IN (
        'Basic Event Feedback',
        'Workshop Evaluation', 
        'Seminar Assessment',
        'Clinical Skills Training'
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Successfully deleted % templates', deleted_count;
    
    -- Check remaining templates
    SELECT COUNT(*) INTO template_count
    FROM feedback_templates;
    
    RAISE NOTICE 'Remaining templates in database: %', template_count;
    
    IF template_count = 0 THEN
        RAISE NOTICE '✅ All templates deleted - database is clean!';
    ELSE
        RAISE NOTICE '📋 % user-created templates remain', template_count;
    END IF;
    
END $$;
