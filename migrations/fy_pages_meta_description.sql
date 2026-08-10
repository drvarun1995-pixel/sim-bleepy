-- Curated SEO meta descriptions for Foundation Year pages
ALTER TABLE fy_pages
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

COMMENT ON COLUMN fy_pages.meta_description IS
  'Optional SEO meta description for public guides. When null, first paragraph is used as fallback.';
