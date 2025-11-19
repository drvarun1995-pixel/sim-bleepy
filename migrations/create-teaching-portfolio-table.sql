-- Create teaching_portfolio_files table
-- Similar to portfolio_files but for Teaching Portfolio
-- Only accessible to CTF and Admin roles

CREATE TABLE IF NOT EXISTS public.teaching_portfolio_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename TEXT,
    original_filename TEXT,
    display_name TEXT,
    file_size BIGINT DEFAULT 0,
    file_type TEXT,
    mime_type TEXT,
    category TEXT NOT NULL CHECK (category IN ('bedside-teaching', 'twilight-teaching', 'core-teaching', 'osce-skills-teaching', 'exams', 'others')),
    evidence_type TEXT CHECK (evidence_type IN ('email', 'certificate', 'document', 'other')),
    file_path TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teaching_portfolio_files_user_id ON public.teaching_portfolio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_teaching_portfolio_files_category ON public.teaching_portfolio_files(category);
CREATE INDEX IF NOT EXISTS idx_teaching_portfolio_files_created_at ON public.teaching_portfolio_files(created_at);

-- Enable Row Level Security
ALTER TABLE public.teaching_portfolio_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own teaching portfolio files" ON public.teaching_portfolio_files;
DROP POLICY IF EXISTS "Users can insert their own teaching portfolio files" ON public.teaching_portfolio_files;
DROP POLICY IF EXISTS "Users can update their own teaching portfolio files" ON public.teaching_portfolio_files;
DROP POLICY IF EXISTS "Users can delete their own teaching portfolio files" ON public.teaching_portfolio_files;

-- RLS Policies
-- Note: We use service_role check since API routes use supabaseAdmin
-- Users can only access their own files through the API which validates role (CTF/Admin)

-- Users can view their own teaching portfolio files (via service_role API)
CREATE POLICY "Users can view their own teaching portfolio files"
    ON public.teaching_portfolio_files FOR SELECT
    USING (auth.role() = 'service_role');

-- Users can insert their own teaching portfolio files (via service_role API)
CREATE POLICY "Users can insert their own teaching portfolio files"
    ON public.teaching_portfolio_files FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Users can update their own teaching portfolio files (via service_role API)
CREATE POLICY "Users can update their own teaching portfolio files"
    ON public.teaching_portfolio_files FOR UPDATE
    USING (auth.role() = 'service_role');

-- Users can delete their own teaching portfolio files (via service_role API)
CREATE POLICY "Users can delete their own teaching portfolio files"
    ON public.teaching_portfolio_files FOR DELETE
    USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE public.teaching_portfolio_files IS 'Teaching Portfolio files - Only accessible to CTF and Admin users';
COMMENT ON COLUMN public.teaching_portfolio_files.category IS 'Teaching category: bedside-teaching, twilight-teaching, core-teaching, osce-skills-teaching, exams, others';
COMMENT ON COLUMN public.teaching_portfolio_files.evidence_type IS 'Type of evidence: email, certificate, document, other';

