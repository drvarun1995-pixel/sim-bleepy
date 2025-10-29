-- ============================================================================
-- FIX FEEDBACK TEMPLATE VIEW SECURITY DEFINER ISSUE
-- ============================================================================
-- This migration fixes the feedback_template_stats view that was created
-- without security_invoker = true, causing security definer issues
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing feedback_template_stats view security';
  RAISE NOTICE '========================================';
END $$;

-- Drop the existing view
DROP VIEW IF EXISTS feedback_template_stats;

-- Recreate the view with security_invoker = true
CREATE VIEW feedback_template_stats
WITH (security_invoker = true) AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.category,
  t.is_system_template,
  t.usage_count,
  t.is_active,
  t.created_at,
  u.name as created_by_name,
  u.role as created_by_role,
  jsonb_array_length(t.questions) as question_count
FROM feedback_templates t
JOIN users u ON t.created_by = u.id
ORDER BY t.usage_count DESC, t.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON feedback_template_stats TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ feedback_template_stats view fixed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'View recreated with security_invoker = true';
  RAISE NOTICE 'This uses the querying user''s permissions (service role)';
  RAISE NOTICE 'Security definer issue resolved';
  RAISE NOTICE '========================================';
END $$;
