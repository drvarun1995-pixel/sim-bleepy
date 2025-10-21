-- ============================================================================
-- CREATE CERTIFICATE TEMPLATES TABLE
-- ============================================================================
-- This migration creates the certificate_templates table to store templates
-- in the database instead of localStorage
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating Certificate Templates Table';
  RAISE NOTICE '========================================';
END $$;

-- 1. Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id TEXT PRIMARY KEY,  -- e.g., 'template-1234567890'
  name TEXT NOT NULL,
  
  -- Template Data
  background_image TEXT NOT NULL,  -- Base64 or URL
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{
  --   "id": "field-1",
  --   "text": "Event Title",
  --   "x": 100,
  --   "y": 200,
  --   "fontSize": 24,
  --   "fontFamily": "Arial",
  --   "color": "#000000",
  --   "dataSource": "event.title"
  -- }]
  
  canvas_size JSONB NOT NULL DEFAULT '{"width": 800, "height": 600}'::jsonb,
  
  -- Ownership & Permissions
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_certificate_templates_created_by ON certificate_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_created_at ON certificate_templates(created_at);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_name ON certificate_templates(name);

-- 3. Add comments
COMMENT ON TABLE certificate_templates IS 'Stores certificate templates with fields and background images';
COMMENT ON COLUMN certificate_templates.created_by IS 'User who created this template (meded_team/ctf can only see their own, admin sees all)';
COMMENT ON COLUMN certificate_templates.fields IS 'JSON array of text field definitions with positions, fonts, data sources';
COMMENT ON COLUMN certificate_templates.canvas_size IS 'Canvas dimensions for the template';

-- 4. Create function to update updated_at
CREATE OR REPLACE FUNCTION update_certificate_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
CREATE TRIGGER trigger_update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_templates_updated_at();

-- 6. Enable RLS
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies

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

-- MedEd Team and CTF can only see their own templates
CREATE POLICY "Staff can view own templates"
  ON certificate_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('meded_team', 'ctf')
      AND certificate_templates.created_by::text = auth.uid()::text
    )
  );

-- Educators can view their own templates (for future use)
CREATE POLICY "Educators can view own templates"
  ON certificate_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'educator'
      AND certificate_templates.created_by::text = auth.uid()::text
    )
  );

-- Only admins, meded_team, and ctf can insert templates
CREATE POLICY "Staff can insert templates"
  ON certificate_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

-- Users can only update their own templates (admins can update all)
CREATE POLICY "Users can update own templates"
  ON certificate_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND (
        users.role = 'admin'
        OR (
          users.role IN ('meded_team', 'ctf', 'educator')
          AND certificate_templates.created_by::text = auth.uid()::text
        )
      )
    )
  );

-- Users can only delete their own templates (admins can delete all)
CREATE POLICY "Users can delete own templates"
  ON certificate_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND (
        users.role = 'admin'
        OR (
          users.role IN ('meded_team', 'ctf', 'educator')
          AND certificate_templates.created_by::text = auth.uid()::text
        )
      )
    )
  );

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Certificate Templates Table Created!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Permissions:';
  RAISE NOTICE '  - Admin: Can see ALL templates';
  RAISE NOTICE '  - MedEd Team/CTF: Can see ONLY their own templates';
  RAISE NOTICE '  - Educator: Can see ONLY their own templates (future)';
  RAISE NOTICE '  - All staff: Can create new templates';
  RAISE NOTICE '  - Users: Can update/delete their own templates';
  RAISE NOTICE '  - Admin: Can update/delete any template';
  RAISE NOTICE '========================================';
END $$;



