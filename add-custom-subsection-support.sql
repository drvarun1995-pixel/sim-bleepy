-- Add support for custom subsections and evidence types
-- This script adds new columns to support user-created subsections and evidence types

-- Add custom subsection column
ALTER TABLE portfolio_files 
ADD COLUMN IF NOT EXISTS custom_subsection TEXT;

-- Add custom evidence type column  
ALTER TABLE portfolio_files 
ADD COLUMN IF NOT EXISTS custom_evidence_type TEXT;

-- Update existing records to use predefined values in custom fields for backward compatibility
UPDATE portfolio_files 
SET custom_subsection = subcategory 
WHERE custom_subsection IS NULL AND subcategory IS NOT NULL;

UPDATE portfolio_files 
SET custom_evidence_type = evidence_type 
WHERE custom_evidence_type IS NULL AND evidence_type IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_custom_subsection ON portfolio_files(custom_subsection);
CREATE INDEX IF NOT EXISTS idx_portfolio_custom_evidence_type ON portfolio_files(custom_evidence_type);
