-- ============================================================================
-- DYNAMIC FEEDBACK TEMPLATES SYSTEM
-- ============================================================================
-- This migration creates a dynamic feedback template system that allows
-- administrators to create, manage, and reuse feedback form templates
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating Dynamic Feedback Templates System';
  RAISE NOTICE '========================================';
END $$;

-- 1. Create feedback_templates table
CREATE TABLE IF NOT EXISTS feedback_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Information
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'custom' CHECK (category IN ('workshop', 'seminar', 'clinical_skills', 'custom', 'system')),
  
  -- Template Data
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata
  is_system_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  
  -- References
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(name, created_by) -- Users can't have duplicate template names
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_templates_category ON feedback_templates(category);
CREATE INDEX IF NOT EXISTS idx_feedback_templates_created_by ON feedback_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_feedback_templates_is_active ON feedback_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_feedback_templates_is_system ON feedback_templates(is_system_template);
CREATE INDEX IF NOT EXISTS idx_feedback_templates_usage_count ON feedback_templates(usage_count DESC);

-- 3. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_feedback_templates_updated_at
  BEFORE UPDATE ON feedback_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_templates_updated_at();

-- 5. Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE feedback_templates 
  SET usage_count = usage_count + 1 
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Enable Row Level Security
ALTER TABLE feedback_templates ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies

-- Everyone can view active templates
CREATE POLICY "Anyone can view active templates"
  ON feedback_templates
  FOR SELECT
  USING (is_active = true);

-- Staff can view all templates (including inactive)
CREATE POLICY "Staff can view all templates"
  ON feedback_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

-- Staff can create templates
CREATE POLICY "Staff can create templates"
  ON feedback_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

-- Staff can update their own templates, admins can update any
CREATE POLICY "Staff can update templates"
  ON feedback_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND (
        users.role = 'admin' OR
        (users.role IN ('meded_team', 'ctf') AND created_by::text = auth.uid()::text)
      )
    )
  );

-- Only admins can delete templates
CREATE POLICY "Admins can delete templates"
  ON feedback_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- 8. Insert default system templates
INSERT INTO feedback_templates (name, description, category, questions, is_system_template, created_by) VALUES
(
  'Basic Event Feedback',
  'Simple 3-question feedback form for general events',
  'custom',
  '[
    {
      "id": "q1",
      "type": "rating",
      "question": "How would you rate this event?",
      "required": true,
      "scale": 5
    },
    {
      "id": "q2",
      "type": "text",
      "question": "What did you learn from this event?",
      "required": false
    },
    {
      "id": "q3",
      "type": "yes_no",
      "question": "Would you recommend this event to others?",
      "required": true
    }
  ]'::jsonb,
  true,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Workshop Evaluation',
  'Comprehensive feedback form for workshop-style events',
  'workshop',
  '[
    {
      "id": "q1",
      "type": "rating",
      "question": "How would you rate this workshop overall?",
      "required": true,
      "scale": 5
    },
    {
      "id": "q2",
      "type": "rating",
      "question": "How relevant was the content to your learning needs?",
      "required": true,
      "scale": 5
    },
    {
      "id": "q3",
      "type": "text",
      "question": "What was the most valuable thing you learned?",
      "required": false
    },
    {
      "id": "q4",
      "type": "long_text",
      "question": "How could this workshop be improved?",
      "required": false
    },
    {
      "id": "q5",
      "type": "yes_no",
      "question": "Would you recommend this workshop to others?",
      "required": true
    }
  ]'::jsonb,
  true,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Seminar Assessment',
  'Feedback form for seminar and presentation events',
  'seminar',
  '[
    {
      "id": "q1",
      "type": "rating",
      "question": "How would you rate the seminar content?",
      "required": true,
      "scale": 5
    },
    {
      "id": "q2",
      "type": "rating",
      "question": "How would you rate the speaker(s)?",
      "required": true,
      "scale": 5
    },
    {
      "id": "q3",
      "type": "text",
      "question": "What was the most useful part of the seminar?",
      "required": false
    },
    {
      "id": "q4",
      "type": "text",
      "question": "How could this seminar be improved?",
      "required": false
    }
  ]'::jsonb,
  true,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
  'Clinical Skills Training',
  'Specialized feedback form for clinical skills training sessions',
  'clinical_skills',
  '[
    {
      "id": "q1",
      "type": "rating",
      "question": "How confident do you feel with these clinical skills?",
      "required": true,
      "scale": 5
    },
    {
      "id": "q2",
      "type": "rating",
      "question": "How practical was the hands-on practice?",
      "required": true,
      "scale": 5
    },
    {
      "id": "q3",
      "type": "text",
      "question": "What specific skills did you practice?",
      "required": false
    },
    {
      "id": "q4",
      "type": "text",
      "question": "How will you apply these skills in practice?",
      "required": false
    },
    {
      "id": "q5",
      "type": "rating",
      "question": "How well did the instructor explain the techniques?",
      "required": true,
      "scale": 5
    },
    {
      "id": "q6",
      "type": "yes_no",
      "question": "Do you feel ready to use these skills independently?",
      "required": true
    }
  ]'::jsonb,
  true,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- 9. Add comprehensive comments
COMMENT ON TABLE feedback_templates IS 'Reusable feedback form templates for creating consistent feedback forms';
COMMENT ON COLUMN feedback_templates.name IS 'Template name (unique per user)';
COMMENT ON COLUMN feedback_templates.description IS 'Template description for users';
COMMENT ON COLUMN feedback_templates.category IS 'Template category for organization';
COMMENT ON COLUMN feedback_templates.questions IS 'JSON array of question objects with type, text, required, etc.';
COMMENT ON COLUMN feedback_templates.is_system_template IS 'Whether this is a system-provided template';
COMMENT ON COLUMN feedback_templates.usage_count IS 'Number of times this template has been used';
COMMENT ON COLUMN feedback_templates.created_by IS 'User who created this template';

-- 10. Create view for template statistics
CREATE OR REPLACE VIEW feedback_template_stats
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

-- 11. Create function to get template by category
CREATE OR REPLACE FUNCTION get_templates_by_category(template_category VARCHAR(50))
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  description TEXT,
  questions JSONB,
  usage_count INTEGER,
  question_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.description,
    t.questions,
    t.usage_count,
    jsonb_array_length(t.questions)::INTEGER as question_count
  FROM feedback_templates t
  WHERE t.category = template_category 
    AND t.is_active = true
  ORDER BY t.usage_count DESC, t.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_templates_by_category TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Dynamic Feedback Templates System Created!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - feedback_templates';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  - feedback_template_stats';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  - update_feedback_templates_updated_at()';
  RAISE NOTICE '  - increment_template_usage()';
  RAISE NOTICE '  - get_templates_by_category()';
  RAISE NOTICE '';
  RAISE NOTICE 'System templates created:';
  RAISE NOTICE '  - Basic Event Feedback';
  RAISE NOTICE '  - Workshop Evaluation';
  RAISE NOTICE '  - Seminar Assessment';
  RAISE NOTICE '  - Clinical Skills Training';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - Dynamic template creation and management';
  RAISE NOTICE '  - Template categorization and search';
  RAISE NOTICE '  - Usage tracking and statistics';
  RAISE NOTICE '  - Row Level Security enabled';
  RAISE NOTICE '  - System and user templates';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Create API endpoints for template management';
  RAISE NOTICE '  2. Update frontend to use dynamic templates';
  RAISE NOTICE '  3. Remove hardcoded template logic';
  RAISE NOTICE '========================================';
END $$;
