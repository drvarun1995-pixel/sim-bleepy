-- Add missing email tracking columns to certificates table
-- Note: email_sent_at already exists, only add the missing ones

-- Add email_status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'certificates' AND column_name = 'email_status'
    ) THEN
        ALTER TABLE certificates 
        ADD COLUMN email_status VARCHAR(20) DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'bounced'));
    END IF;
END $$;

-- Add email_error_message column if it doesn't exist (rename from email_error if needed)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'certificates' AND column_name = 'email_error_message'
    ) THEN
        -- Check if email_error exists and rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'certificates' AND column_name = 'email_error'
        ) THEN
            ALTER TABLE certificates RENAME COLUMN email_error TO email_error_message;
        ELSE
            ALTER TABLE certificates ADD COLUMN email_error_message TEXT;
        END IF;
    END IF;
END $$;

-- Add indexes for email status queries (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_certificates_email_status ON certificates(email_status);
CREATE INDEX IF NOT EXISTS idx_certificates_email_sent_at ON certificates(email_sent_at);

-- Add comments for documentation
COMMENT ON COLUMN certificates.email_sent_at IS 'Timestamp when certificate email was sent';
COMMENT ON COLUMN certificates.email_status IS 'Status of certificate email delivery: pending, sent, failed, bounced';
COMMENT ON COLUMN certificates.email_error_message IS 'Error message if email sending failed';
