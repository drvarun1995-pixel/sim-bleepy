-- ============================================================================
-- ADD FEEDBACK TEMPLATE SHARING FEATURE
-- ============================================================================
-- This migration adds sharing functionality to feedback_templates table
-- similar to certificate templates
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Adding Feedback Template Sharing Feature';
  RAISE NOTICE '========================================';
END $$;

-- 1. Add sharing columns to feedback_templates table
ALTER TABLE feedback_templates 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add indexes for sharing functionality
CREATE INDEX IF NOT EXISTS idx_feedback_templates_is_shared ON feedback_templates(is_shared);
CREATE INDEX IF NOT EXISTS idx_feedback_templates_shared_at ON feedback_templates(shared_at);

-- 3. Add comments
COMMENT ON COLUMN feedback_templates.is_shared IS 'Whether this template is shared with other users';
COMMENT ON COLUMN feedback_templates.shared_at IS 'When the template was shared';
COMMENT ON COLUMN feedback_templates.shared_by IS 'User who shared the template';

-- 4. Update RLS policies to support shared templates

-- Drop existing policies to recreate them with sharing support
DROP POLICY IF EXISTS "Anyone can view active templates" ON feedback_templates;
DROP POLICY IF EXISTS "Staff can view all templates" ON feedback_templates;
DROP POLICY IF EXISTS "Staff can update templates" ON feedback_templates;

-- Create new policies with sharing support

-- Admins can see all templates
CREATE POLICY "Admins can view all templates"
  ON feedback_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- MedEd Team and CTF can see their own templates + shared templates
CREATE POLICY "Staff can view own and shared templates"
  ON feedback_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('meded_team', 'ctf')
      AND (
        feedback_templates.created_by::text = auth.uid()::text
        OR feedback_templates.is_shared = true
      )
    )
  );

-- Educators can see their own templates + shared templates
CREATE POLICY "Educators can view own and shared templates"
  ON feedback_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'educator'
      AND (
        feedback_templates.created_by::text = auth.uid()::text
        OR feedback_templates.is_shared = true
      )
    )
  );

-- Update the update policy to allow users to edit their own templates and admins to edit any
CREATE POLICY "Users can update own templates, admins can update any"
  ON feedback_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND (
        users.role = 'admin' OR
        (users.role IN ('meded_team', 'ctf', 'educator') AND feedback_templates.created_by::text = auth.uid()::text)
      )
    )
  );

-- Create function to update shared_at when is_shared becomes true
CREATE OR REPLACE FUNCTION update_feedback_template_shared_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_shared changed from false to true, set shared_at and shared_by
  IF OLD.is_shared = false AND NEW.is_shared = true THEN
    NEW.shared_at = NOW();
    NEW.shared_by = auth.uid();
  END IF;
  
  -- If is_shared changed from true to false, clear shared_at and shared_by
  IF OLD.is_shared = true AND NEW.is_shared = false THEN
    NEW.shared_at = NULL;
    NEW.shared_by = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update shared_at
CREATE TRIGGER trigger_update_feedback_template_shared_at
  BEFORE UPDATE ON feedback_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_template_shared_at();

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Feedback template sharing feature added successfully!';
  RAISE NOTICE '========================================';
END $$;
