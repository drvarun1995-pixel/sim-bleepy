-- Create portfolio_files table
CREATE TABLE IF NOT EXISTS portfolio_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('postgraduate', 'presentations', 'publications', 'teaching-experience', 'training-in-teaching', 'qi')),
  subcategory TEXT,
  evidence_type TEXT,
  pmid TEXT,
  url TEXT,
  file_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_files_user_id ON portfolio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_files_category ON portfolio_files(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_files_created_at ON portfolio_files(created_at);

-- Enable RLS
ALTER TABLE portfolio_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own files
CREATE POLICY "Users can view their own portfolio files" ON portfolio_files
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own files
CREATE POLICY "Users can insert their own portfolio files" ON portfolio_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own files
CREATE POLICY "Users can update their own portfolio files" ON portfolio_files
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own files
CREATE POLICY "Users can delete their own portfolio files" ON portfolio_files
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portfolio_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_portfolio_files_updated_at
  BEFORE UPDATE ON portfolio_files
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_files_updated_at();
