-- ============================================================================
-- FEEDBACK AND QR CODE ATTENDANCE SYSTEM
-- ============================================================================
-- This migration creates the feedback and QR code attendance system tables
-- for event attendance tracking and feedback collection
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating Feedback and QR Code System';
  RAISE NOTICE '========================================';
END $$;

-- 1. Create event_qr_codes table
CREATE TABLE IF NOT EXISTS event_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- QR Code Data
  qr_code_data TEXT NOT NULL, -- Encrypted unique identifier
  qr_code_image_url TEXT NOT NULL, -- Supabase Storage URL
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Scan Window (configurable per event)
  scan_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scan_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(event_id)
);

-- 2. Create qr_code_scans table (audit log)
CREATE TABLE IF NOT EXISTS qr_code_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  qr_code_id UUID NOT NULL REFERENCES event_qr_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES event_bookings(id) ON DELETE CASCADE,
  
  -- Scan Data
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scan_success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create feedback_forms table
CREATE TABLE IF NOT EXISTS feedback_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Form Data
  form_name TEXT NOT NULL,
  form_template TEXT NOT NULL CHECK (form_template IN ('workshop', 'seminar', 'clinical_skills', 'custom')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create feedback_responses table
CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  feedback_form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES event_bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Response Data
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(feedback_form_id, user_id)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_qr_codes_event_id ON event_qr_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_qr_codes_active ON event_qr_codes(active);
CREATE INDEX IF NOT EXISTS idx_event_qr_codes_scan_window ON event_qr_codes(scan_window_start, scan_window_end);

CREATE INDEX IF NOT EXISTS idx_qr_code_scans_qr_code_id ON qr_code_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_user_id ON qr_code_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_booking_id ON qr_code_scans(booking_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_scanned_at ON qr_code_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_success ON qr_code_scans(scan_success);

CREATE INDEX IF NOT EXISTS idx_feedback_forms_event_id ON feedback_forms(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_forms_created_by ON feedback_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_feedback_forms_active ON feedback_forms(active);
CREATE INDEX IF NOT EXISTS idx_feedback_forms_template ON feedback_forms(form_template);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_form_id ON feedback_responses(feedback_form_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_event_id ON feedback_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_user_id ON feedback_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_booking_id ON feedback_responses(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_completed_at ON feedback_responses(completed_at);

-- 6. Create functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_feedback_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_feedback_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers to automatically update updated_at
CREATE TRIGGER trigger_update_event_qr_codes_updated_at
  BEFORE UPDATE ON event_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_event_qr_codes_updated_at();

CREATE TRIGGER trigger_update_feedback_forms_updated_at
  BEFORE UPDATE ON feedback_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_forms_updated_at();

CREATE TRIGGER trigger_update_feedback_responses_updated_at
  BEFORE UPDATE ON feedback_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_responses_updated_at();

-- 8. Enable Row Level Security
ALTER TABLE event_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies

-- Event QR Codes Policies
CREATE POLICY "Staff can view all QR codes"
  ON event_qr_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Staff can insert QR codes"
  ON event_qr_codes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Staff can update QR codes"
  ON event_qr_codes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Admins can delete QR codes"
  ON event_qr_codes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- QR Code Scans Policies
CREATE POLICY "Users can view their own scans"
  ON qr_code_scans
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Staff can view all scans"
  ON qr_code_scans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "System can insert scans"
  ON qr_code_scans
  FOR INSERT
  WITH CHECK (true); -- Allow system to insert scans

-- Feedback Forms Policies
CREATE POLICY "Staff can view all feedback forms"
  ON feedback_forms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Staff can insert feedback forms"
  ON feedback_forms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Staff can update feedback forms"
  ON feedback_forms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Admins can delete feedback forms"
  ON feedback_forms
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Feedback Responses Policies
CREATE POLICY "Users can view their own responses"
  ON feedback_responses
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Staff can view all responses"
  ON feedback_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('admin', 'meded_team', 'ctf')
    )
  );

CREATE POLICY "Users can insert their own responses"
  ON feedback_responses
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own responses"
  ON feedback_responses
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- 10. Add comprehensive comments
COMMENT ON TABLE event_qr_codes IS 'Stores QR codes for event attendance tracking';
COMMENT ON TABLE qr_code_scans IS 'Audit log of QR code scans for attendance tracking';
COMMENT ON TABLE feedback_forms IS 'Feedback forms for events with customizable questions';
COMMENT ON TABLE feedback_responses IS 'User responses to feedback forms';

COMMENT ON COLUMN event_qr_codes.qr_code_data IS 'Encrypted unique identifier for QR code';
COMMENT ON COLUMN event_qr_codes.qr_code_image_url IS 'Supabase Storage URL for QR code image';
COMMENT ON COLUMN event_qr_codes.scan_window_start IS 'When QR code scanning becomes active';
COMMENT ON COLUMN event_qr_codes.scan_window_end IS 'When QR code scanning expires';

COMMENT ON COLUMN qr_code_scans.scan_success IS 'Whether the scan was successful';
COMMENT ON COLUMN qr_code_scans.failure_reason IS 'Reason for scan failure if unsuccessful';

COMMENT ON COLUMN feedback_forms.questions IS 'JSON array of question objects with type, text, required, etc.';
COMMENT ON COLUMN feedback_responses.responses IS 'JSON object with question_id: answer pairs';

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Feedback and QR Code System Created!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - event_qr_codes';
  RAISE NOTICE '  - qr_code_scans';
  RAISE NOTICE '  - feedback_forms';
  RAISE NOTICE '  - feedback_responses';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - QR code generation and scanning';
  RAISE NOTICE '  - Attendance tracking';
  RAISE NOTICE '  - Feedback form creation and responses';
  RAISE NOTICE '  - Row Level Security enabled';
  RAISE NOTICE '  - Performance indexes created';
  RAISE NOTICE '  - Auto-updating timestamps';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Run update-event-bookings-for-feedback.sql';
  RAISE NOTICE '  2. Run update-events-for-qr-codes.sql';
  RAISE NOTICE '  3. Create "qr-codes" storage bucket';
  RAISE NOTICE '  4. Build API endpoints';
  RAISE NOTICE '========================================';
END $$;


