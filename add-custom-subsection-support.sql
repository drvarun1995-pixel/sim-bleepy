-- Add support for custom subsections and evidence types
-- This script adds new columns to support user-created subsections and evidence types

-- Add custom subsection column
ALTER TABLE portfolio_files 
ADD COLUMN IF NOT EXISTS custom_subsection TEXT;

-- Update existing records to use predefined values in custom fields for backward compatibility
UPDATE portfolio_files 
SET custom_subsection = subcategory 
WHERE custom_subsection IS NULL AND subcategory IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_custom_subsection ON portfolio_files(custom_subsection);
