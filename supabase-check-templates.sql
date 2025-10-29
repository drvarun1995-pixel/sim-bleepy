-- ============================================================================
-- SUPABASE FEEDBACK TEMPLATES CHECK SCRIPT
-- ============================================================================
-- Run this script in Supabase SQL Editor to check what templates exist
-- ============================================================================

-- 1. Check all feedback templates with details
SELECT 
    id,
    name,
    description,
    category,
    is_system_template,
    is_active,
    is_shared,
    usage_count,
    created_at,
    created_by,
    CASE 
        WHEN is_system_template = true THEN '🔒 System Template'
        ELSE '👤 User Template'
    END as template_type
FROM feedback_templates
ORDER BY created_at DESC;

-- 2. Count templates by type
SELECT 
    CASE 
        WHEN is_system_template = true THEN 'System Templates'
        ELSE 'User Templates'
    END as template_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN is_shared = true THEN 1 END) as shared_count
FROM feedback_templates
GROUP BY is_system_template;

-- 3. Check specifically for the seeded templates (if any exist)
SELECT 
    name,
    is_system_template,
    is_active,
    created_at,
    CASE 
        WHEN name IN (
            'Basic Event Feedback',
            'Workshop Evaluation', 
            'Seminar Assessment',
            'Clinical Skills Training'
        ) THEN '🌱 Seeded Template'
        ELSE '📝 Custom Template'
    END as template_source
FROM feedback_templates
WHERE name IN (
    'Basic Event Feedback',
    'Workshop Evaluation', 
    'Seminar Assessment',
    'Clinical Skills Training'
)
ORDER BY name;

-- 4. Show template usage statistics
SELECT 
    name,
    usage_count,
    CASE 
        WHEN usage_count = 0 THEN '📊 Never Used'
        WHEN usage_count < 5 THEN '📈 Lightly Used'
        WHEN usage_count < 20 THEN '📊 Moderately Used'
        ELSE '🔥 Heavily Used'
    END as usage_level
FROM feedback_templates
ORDER BY usage_count DESC;

-- 5. Show recent activity
SELECT 
    name,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at > created_at THEN '✏️ Modified'
        ELSE '🆕 Original'
    END as status
FROM feedback_templates
ORDER BY updated_at DESC, created_at DESC
LIMIT 10;
