-- ============================================================================
-- UPDATE EVENTS FOR QR CODES AND AUTO-CERTIFICATE SYSTEM
-- ============================================================================
-- This migration adds QR code and auto-certificate columns to the events table
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updating events for QR codes and auto-certificates';
  RAISE NOTICE '========================================';
END $$;

-- Add QR code and feedback columns to events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS qr_attendance_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS feedback_required_for_certificate BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS feedback_deadline_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_generate_certificate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_template_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS certificate_auto_send_email BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_qr_attendance_enabled 
ON events(qr_attendance_enabled);

CREATE INDEX IF NOT EXISTS idx_events_auto_generate_certificate 
ON events(auto_generate_certificate);

CREATE INDEX IF NOT EXISTS idx_events_certificate_template_id 
ON events(certificate_template_id);

CREATE INDEX IF NOT EXISTS idx_events_feedback_required_for_certificate 
ON events(feedback_required_for_certificate);

-- Add comments
COMMENT ON COLUMN events.qr_attendance_enabled IS 'Whether QR code attendance tracking is enabled for this event';
COMMENT ON COLUMN events.feedback_required_for_certificate IS 'Whether feedback completion is required before certificate generation';
COMMENT ON COLUMN events.feedback_deadline_days IS 'Number of days after event to complete feedback (NULL = no deadline)';
COMMENT ON COLUMN events.auto_generate_certificate IS 'Whether certificates are automatically generated after feedback completion';
COMMENT ON COLUMN events.certificate_template_id IS 'ID of certificate template to use for auto-generation';
COMMENT ON COLUMN events.certificate_auto_send_email IS 'Whether to automatically send certificates via email when auto-generated';

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Events Updated for QR Codes and Auto-Certificates!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added columns:';
  RAISE NOTICE '  - qr_attendance_enabled (BOOLEAN)';
  RAISE NOTICE '  - feedback_required_for_certificate (BOOLEAN)';
  RAISE NOTICE '  - feedback_deadline_days (INTEGER)';
  RAISE NOTICE '  - auto_generate_certificate (BOOLEAN)';
  RAISE NOTICE '  - certificate_template_id (TEXT)';
  RAISE NOTICE '  - certificate_auto_send_email (BOOLEAN)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created indexes for performance';
  RAISE NOTICE '========================================';
END $$;


