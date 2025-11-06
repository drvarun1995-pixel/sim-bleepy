-- Add status field to specialty_pages table
-- Status can be 'published' or 'draft' (default 'draft')
ALTER TABLE specialty_pages 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('published', 'draft'));

-- Add comment for documentation
COMMENT ON COLUMN specialty_pages.status IS 'Page status: published (visible) or draft (hidden)';

-- Create junction table for specialty_pages and categories
CREATE TABLE IF NOT EXISTS specialty_page_categories (
    page_id UUID REFERENCES specialty_pages(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (page_id, category_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_specialty_page_categories_page_id ON specialty_page_categories(page_id);
CREATE INDEX IF NOT EXISTS idx_specialty_page_categories_category_id ON specialty_page_categories(category_id);

-- Add comment for documentation
COMMENT ON TABLE specialty_page_categories IS 'Junction table linking specialty pages to categories for filtering and search';

