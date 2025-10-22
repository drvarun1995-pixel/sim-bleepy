-- ============================================================================
-- ADD TEMPLATE SHARING FEATURE
-- ============================================================================
-- This migration adds sharing functionality to certificate_templates table
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Adding Template Sharing Feature';
  RAISE NOTICE '========================================';
END $$;

-- 1. Add sharing columns to certificate_templates table
ALTER TABLE certificate_templates 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add indexes for sharing functionality
CREATE INDEX IF NOT EXISTS idx_certificate_templates_is_shared ON certificate_templates(is_shared);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_shared_at ON certificate_templates(shared_at);

-- 3. Add comments
COMMENT ON COLUMN certificate_templates.is_shared IS 'Whether this template is shared with other users';
COMMENT ON COLUMN certificate_templates.shared_at IS 'When the template was shared';
COMMENT ON COLUMN certificate_templates.shared_by IS 'User who shared the template';

-- 4. Update RLS policies to support shared templates

-- Drop existing policies to recreate them with sharing support
DROP POLICY IF EXISTS "Admins can view all templates" ON certificate_templates;
DROP POLICY IF EXISTS "Staff can view own templates" ON certificate_templates;
DROP POLICY IF EXISTS "Educators can view own templates" ON certificate_templates;

-- Create new policies with sharing support

-- Admins can see all templates
CREATE POLICY "Admins can view all templates"
  ON certificate_templates
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
  ON certificate_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('meded_team', 'ctf')
      AND (
        certificate_templates.created_by::text = auth.uid()::text
        OR certificate_templates.is_shared = true
      )
    )
  );

-- Educators can see their own templates + shared templates
CREATE POLICY "Educators can view own and shared templates"
  ON certificate_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'educator'
      AND (
        certificate_templates.created_by::text = auth.uid()::text
        OR certificate_templates.is_shared = true
      )
    )
  );

-- Create function to update shared_at when is_shared becomes true
CREATE OR REPLACE FUNCTION update_template_shared_at()
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
CREATE TRIGGER trigger_update_template_shared_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_shared_at();

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Template Sharing Feature Added!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'New Features:';
  RAISE NOTICE '  - Templates can be marked as shared';
  RAISE NOTICE '  - Shared templates are visible to all staff';
  RAISE NOTICE '  - Automatic tracking of sharing status';
  RAISE NOTICE '  - Role-based access control maintained';
  RAISE NOTICE '';
  RAISE NOTICE 'Access Rules:';
  RAISE NOTICE '  - Admin: Can see ALL templates';
  RAISE NOTICE '  - MedEd Team/CTF: Can see own + shared templates';
  RAISE NOTICE '  - Educator: Can see own + shared templates';
  RAISE NOTICE '  - Users can share/unshare their own templates';
  RAISE NOTICE '========================================';
END $$;

