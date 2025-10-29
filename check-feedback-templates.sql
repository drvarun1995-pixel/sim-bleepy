-- ============================================================================
-- CHECK FEEDBACK TEMPLATES IN DATABASE
-- ============================================================================
-- This script checks what feedback templates currently exist in the database
-- ============================================================================

-- Check all feedback templates
SELECT 
    id,
    name,
    description,
    category,
    is_system_template,
    is_active,
    usage_count,
    created_at,
    created_by
FROM feedback_templates
ORDER BY created_at DESC;

-- Count templates by type
SELECT 
    CASE 
        WHEN is_system_template = true THEN 'System Templates'
        ELSE 'User Templates'
    END as template_type,
    COUNT(*) as count
FROM feedback_templates
GROUP BY is_system_template;

-- Check specifically for the seeded templates
SELECT 
    name,
    is_system_template,
    created_at
FROM feedback_templates
WHERE name IN (
    'Basic Event Feedback',
    'Workshop Evaluation', 
    'Seminar Assessment',
    'Clinical Skills Training'
)
ORDER BY name;
