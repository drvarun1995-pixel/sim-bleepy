-- Add certificate_id column to certificates table
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS certificate_id TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN certificates.certificate_id IS 'Unique identifier for the certificate (UUID)';

-- Update existing records to have a certificate_id if they don't have one
UPDATE certificates 
SET certificate_id = id::text 
WHERE certificate_id IS NULL;

-- Make certificate_id unique
ALTER TABLE certificates 
ADD CONSTRAINT certificates_certificate_id_unique UNIQUE (certificate_id);
