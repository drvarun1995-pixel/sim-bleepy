-- Add subcategory, evidence_type, and display_name columns to portfolio_files table
ALTER TABLE portfolio_files 
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS evidence_type TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS pmid TEXT,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN portfolio_files.subcategory IS 'Subcategory for more specific file classification within each category';
COMMENT ON COLUMN portfolio_files.evidence_type IS 'Type of evidence for the file';
COMMENT ON COLUMN portfolio_files.display_name IS 'User-defined display name for the file';
COMMENT ON COLUMN portfolio_files.pmid IS 'PubMed ID for publications';
COMMENT ON COLUMN portfolio_files.url IS 'URL for publications or other references';
