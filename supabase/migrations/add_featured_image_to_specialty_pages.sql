-- Add featured_image column to specialty_pages table
-- This column stores the path to the featured image in Supabase Storage

ALTER TABLE specialty_pages 
ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN specialty_pages.featured_image IS 'Path to featured image in Supabase Storage (e.g., {specialtySlug}/{pageSlug}/images/featured.webp)';

