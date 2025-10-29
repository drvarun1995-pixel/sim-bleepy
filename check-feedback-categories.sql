-- ============================================================================
-- FEEDBACK TEMPLATES CATEGORIES ANALYSIS
-- ============================================================================
-- This script checks what category data exists in the feedback_templates table
-- ============================================================================

-- 1. Check the current schema of feedback_templates table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'feedback_templates' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 2. Check all unique categories currently in use
SELECT 
    category,
    COUNT(*) as template_count,
    COUNT(CASE WHEN is_system_template = true THEN 1 END) as system_templates,
    COUNT(CASE WHEN is_system_template = false THEN 1 END) as user_templates
FROM 
    feedback_templates
GROUP BY 
    category
ORDER BY 
    template_count DESC;

-- 3. Check if there are any constraints on the category column
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM 
    information_schema.table_constraints tc
LEFT JOIN 
    information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE 
    tc.table_name = 'feedback_templates' 
    AND tc.table_schema = 'public'
    AND (tc.constraint_type = 'CHECK' OR cc.check_clause IS NOT NULL);

-- 4. Check if category column is referenced by any views or functions
SELECT 
    schemaname,
    viewname,
    definition
FROM 
    pg_views 
WHERE 
    definition ILIKE '%feedback_templates%category%'
    AND schemaname = 'public';

-- 5. Check if there are any indexes on the category column
SELECT 
    indexname,
    indexdef
FROM 
    pg_indexes 
WHERE 
    tablename = 'feedback_templates' 
    AND schemaname = 'public'
    AND indexdef ILIKE '%category%';

-- 6. Sample of templates with their categories
SELECT 
    id,
    name,
    category,
    is_system_template,
    is_active,
    created_at
FROM 
    feedback_templates
ORDER BY 
    created_at DESC
LIMIT 10;

-- 7. Check if any templates have NULL categories
SELECT 
    COUNT(*) as null_category_count
FROM 
    feedback_templates
WHERE 
    category IS NULL;

-- 8. Check if any templates have empty string categories
SELECT 
    COUNT(*) as empty_category_count
FROM 
    feedback_templates
WHERE 
    category = '';

-- 9. Check the most recent templates and their categories
SELECT 
    name,
    category,
    is_system_template,
    created_at
FROM 
    feedback_templates
ORDER BY 
    created_at DESC
LIMIT 5;

-- 10. Summary of category usage
SELECT 
    'Total Templates' as metric,
    COUNT(*) as count
FROM 
    feedback_templates
UNION ALL
SELECT 
    'Unique Categories' as metric,
    COUNT(DISTINCT category) as count
FROM 
    feedback_templates
UNION ALL
SELECT 
    'System Templates' as metric,
    COUNT(*) as count
FROM 
    feedback_templates
WHERE 
    is_system_template = true
UNION ALL
SELECT 
    'User Templates' as metric,
    COUNT(*) as count
FROM 
    feedback_templates
WHERE 
    is_system_template = false;
