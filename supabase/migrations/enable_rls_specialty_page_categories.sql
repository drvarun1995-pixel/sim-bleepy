-- Enable Row Level Security (RLS) on specialty_page_categories table
-- This is required for security when the table is in a public schema
-- All access goes through API routes which use service role, so we enable RLS
-- and add a service role policy

-- Enable RLS
ALTER TABLE specialty_page_categories ENABLE ROW LEVEL SECURITY;

-- Service role full access (for API operations)
-- This allows the API routes (which use supabaseAdmin/service role) to work
DROP POLICY IF EXISTS "Service role full access to specialty_page_categories" ON specialty_page_categories;
CREATE POLICY "Service role full access to specialty_page_categories"
  ON specialty_page_categories FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow public read access (for viewing category links on pages)
-- This allows anyone to read which categories are linked to pages
CREATE POLICY "Allow public read access to specialty page categories"
  ON specialty_page_categories
  FOR SELECT
  TO public
  USING (true);

-- Note: All write operations (INSERT, UPDATE, DELETE) are handled through
-- API routes which use service role and have role-based authorization checks.
-- This RLS setup satisfies security requirements while allowing the API to function.

