-- Ensure user isolation for custom subsections
-- This script adds additional constraints and indexes for better user isolation

-- Add composite index for user_id and custom_subsection for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_user_custom_subsection 
ON portfolio_files(user_id, custom_subsection) 
WHERE custom_subsection IS NOT NULL;

-- Add composite index for user_id and category for category-based queries
CREATE INDEX IF NOT EXISTS idx_portfolio_user_category 
ON portfolio_files(user_id, category);

-- Ensure RLS policies are in place (if not already created)
-- Note: These should already exist from previous setup, but adding for completeness

-- Policy to ensure users can only see their own files
DROP POLICY IF EXISTS "Users can view their own portfolio files" ON portfolio_files;
CREATE POLICY "Users can view their own portfolio files" 
ON portfolio_files FOR SELECT 
USING (user_id = auth.uid()::text);

-- Policy to ensure users can only insert their own files
DROP POLICY IF EXISTS "Users can insert their own portfolio files" ON portfolio_files;
CREATE POLICY "Users can insert their own portfolio files" 
ON portfolio_files FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

-- Policy to ensure users can only update their own files
DROP POLICY IF EXISTS "Users can update their own portfolio files" ON portfolio_files;
CREATE POLICY "Users can update their own portfolio files" 
ON portfolio_files FOR UPDATE 
USING (user_id = auth.uid()::text);

-- Policy to ensure users can only delete their own files
DROP POLICY IF EXISTS "Users can delete their own portfolio files" ON portfolio_files;
CREATE POLICY "Users can delete their own portfolio files" 
ON portfolio_files FOR DELETE 
USING (user_id = auth.uid()::text);

-- Enable RLS on the table
ALTER TABLE portfolio_files ENABLE ROW LEVEL SECURITY;
