-- ============================================================================
-- RUN CERTIFICATE SYSTEM MIGRATIONS
-- ============================================================================
-- This script runs both certificate migrations in the correct order
-- ============================================================================

-- Migration 1: Create certificates table
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating Certificates System';
  RAISE NOTICE '========================================';
END $$;

-- 1. Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES event_bookings(id) ON DELETE SET NULL,
  
  -- Template & Generation Info
  template_id TEXT NOT NULL,
  template_name TEXT,
  
  -- Certificate Data (stores the actual values used for generation)
  certificate_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- File Storage
  certificate_url TEXT NOT NULL,  -- Supabase Storage URL
  certificate_filename TEXT NOT NULL,
  
  -- Email Status
  sent_via_email BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_error TEXT,
  
  -- Generation Metadata
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_event_id ON certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_booking_id ON certificates(booking_id);
CREATE INDEX IF NOT EXISTS idx_certificates_generated_by ON certificates(generated_by);
CREATE INDEX IF NOT EXISTS idx_certificates_generated_at ON certificates(generated_at);
CREATE INDEX IF NOT EXISTS idx_certificates_sent_via_email ON certificates(sent_via_email);

-- 3. Add comprehensive comments
COMMENT ON TABLE certificates IS 'Stores generated certificates for event attendees';
COMMENT ON COLUMN certificates.event_id IS 'Reference to the event this certificate is for';
COMMENT ON COLUMN certificates.user_id IS 'Reference to the user/attendee this certificate is for';
COMMENT ON COLUMN certificates.booking_id IS 'Reference to the booking (if available)';
COMMENT ON COLUMN certificates.template_id IS 'ID of the template used to generate this certificate';
COMMENT ON COLUMN certificates.template_name IS 'Human-readable name of the template';
COMMENT ON COLUMN certificates.certificate_data IS 'JSON data containing the actual values used in certificate generation';
COMMENT ON COLUMN certificates.certificate_url IS 'Supabase Storage URL to the generated certificate file';
COMMENT ON COLUMN certificates.certificate_filename IS 'Original filename of the certificate file';
COMMENT ON COLUMN certificates.sent_via_email IS 'Whether this certificate was sent via email';
COMMENT ON COLUMN certificates.email_sent_at IS 'When the email was sent (if applicable)';
COMMENT ON COLUMN certificates.email_error IS 'Error message if email sending failed';
COMMENT ON COLUMN certificates.generated_by IS 'User who generated this certificate';
COMMENT ON COLUMN certificates.generated_at IS 'When this certificate was generated';

-- 4. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_updated_at();

-- 6. Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Users can view own certificates"
ON certificates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all certificates"
ON certificates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf', 'educator')
  )
);

CREATE POLICY "Staff can insert certificates"
ON certificates FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf')
  )
);

CREATE POLICY "Staff can update certificates"
ON certificates FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'meded_team', 'ctf')
  )
);

CREATE POLICY "Admins can delete certificates"
ON certificates FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Migration 2: Create certificate templates table
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
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Access Control
  is_public BOOLEAN DEFAULT false,
  shared_with_roles TEXT[] DEFAULT '{}'  -- Array of role names that can use this template
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_certificate_templates_created_by ON certificate_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_created_at ON certificate_templates(created_at);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_is_public ON certificate_templates(is_public);

-- 3. Add comments
COMMENT ON TABLE certificate_templates IS 'Stores certificate templates created by users';
COMMENT ON COLUMN certificate_templates.id IS 'Unique identifier for the template';
COMMENT ON COLUMN certificate_templates.name IS 'Human-readable name of the template';
COMMENT ON COLUMN certificate_templates.background_image IS 'Base64 encoded image or URL to background image';
COMMENT ON COLUMN certificate_templates.fields IS 'JSON array of text fields and their properties';
COMMENT ON COLUMN certificate_templates.created_by IS 'User who created this template';
COMMENT ON COLUMN certificate_templates.is_public IS 'Whether this template is publicly available';
COMMENT ON COLUMN certificate_templates.shared_with_roles IS 'Array of role names that can use this template';

-- 4. Create trigger for updated_at
CREATE TRIGGER trigger_update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_updated_at();

-- 5. Enable RLS
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for templates
CREATE POLICY "Users can view own templates"
ON certificate_templates FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can view public templates"
ON certificate_templates FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "Admins can view all templates"
ON certificate_templates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can create templates"
ON certificate_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
ON certificate_templates FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update all templates"
ON certificate_templates FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can delete own templates"
ON certificate_templates FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all templates"
ON certificate_templates FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Success messages
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Certificate System Migrations Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - certificates (with RLS policies)';
  RAISE NOTICE '  - certificate_templates (with RLS policies)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create storage bucket named "certificates"';
  RAISE NOTICE '  2. Add RLS policies to storage bucket';
  RAISE NOTICE '  3. Test the certificate system';
  RAISE NOTICE '========================================';
END $$;









