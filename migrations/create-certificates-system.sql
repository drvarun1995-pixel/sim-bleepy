-- ============================================================================
-- CREATE CERTIFICATES SYSTEM
-- ============================================================================
-- This migration creates the certificates table and storage bucket for 
-- event attendance certificates
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
  -- Example: {
  --   "attendee_name": "Dr. John Smith",
  --   "event_title": "Advanced Training",
  --   "event_date": "15 December 2024",
  --   "certificate_id": "CERT-2024-ABC123"
  -- }
  
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate certificates for same event/user
  UNIQUE(event_id, user_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_event_id ON certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_booking_id ON certificates(booking_id);
CREATE INDEX IF NOT EXISTS idx_certificates_template_id ON certificates(template_id);
CREATE INDEX IF NOT EXISTS idx_certificates_generated_at ON certificates(generated_at);
CREATE INDEX IF NOT EXISTS idx_certificates_sent_via_email ON certificates(sent_via_email);

-- 3. Add comprehensive comments
COMMENT ON TABLE certificates IS 'Stores generated event attendance certificates with metadata and email status';
COMMENT ON COLUMN certificates.event_id IS 'Reference to the event this certificate is for';
COMMENT ON COLUMN certificates.user_id IS 'Reference to the user/attendee receiving the certificate';
COMMENT ON COLUMN certificates.booking_id IS 'Reference to the event booking (nullable for manual certificates)';
COMMENT ON COLUMN certificates.template_id IS 'ID of the certificate template used';
COMMENT ON COLUMN certificates.certificate_data IS 'JSON object containing all field values used in the certificate';
COMMENT ON COLUMN certificates.certificate_url IS 'Public URL to the certificate image in Supabase Storage';
COMMENT ON COLUMN certificates.sent_via_email IS 'Whether certificate has been emailed to the recipient';
COMMENT ON COLUMN certificates.generated_by IS 'Admin/user who generated the certificate';

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

-- 6. Enable Row Level Security
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies

-- Users can view their own certificates
CREATE POLICY "Users can view their own certificates"
  ON certificates
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Admins, educators, meded_team, and ctf can view all certificates
CREATE POLICY "Staff can view all certificates"
  ON certificates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
    )
  );

-- Only admins, meded_team, and ctf can insert certificates
-- Note: meded_team and ctf can only use their own templates (enforced in application)
CREATE POLICY "Staff can insert certificates"
  ON certificates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

-- Only admins can update certificates
CREATE POLICY "Admins can update certificates"
  ON certificates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Only admins can delete certificates
CREATE POLICY "Admins can delete certificates"
  ON certificates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Certificates System Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table: certificates';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - Links to events, users, and bookings';
  RAISE NOTICE '  - Stores certificate data as JSON';
  RAISE NOTICE '  - Tracks email delivery status';
  RAISE NOTICE '  - Prevents duplicate certificates per user/event';
  RAISE NOTICE '  - Row Level Security enabled';
  RAISE NOTICE '  - Auto-updating timestamps';
  RAISE NOTICE '  - Performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Create "certificates" storage bucket in Supabase Storage';
  RAISE NOTICE '  2. Set bucket to private (only authenticated users)';
  RAISE NOTICE '  3. Build certificate generation interface';
  RAISE NOTICE '========================================';
END $$;

