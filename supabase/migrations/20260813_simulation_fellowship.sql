-- Simulation Fellowship evidence files (CTF / Admin only, enforced in API).
-- Storage bucket: "Simulation Fellowship" (same pattern as "IMT Portfolio").
-- Path: {UserName}/{requirement folder}/{file}

CREATE TABLE IF NOT EXISTS public.simulation_fellowship_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requirement_key TEXT NOT NULL,
    filename TEXT,
    original_filename TEXT,
    file_size BIGINT DEFAULT 0,
    file_type TEXT,
    mime_type TEXT,
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulation_fellowship_files_user_id
  ON public.simulation_fellowship_files(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_fellowship_files_requirement
  ON public.simulation_fellowship_files(user_id, requirement_key);

ALTER TABLE public.simulation_fellowship_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own simulation fellowship files" ON public.simulation_fellowship_files;
DROP POLICY IF EXISTS "Users can insert their own simulation fellowship files" ON public.simulation_fellowship_files;
DROP POLICY IF EXISTS "Users can update their own simulation fellowship files" ON public.simulation_fellowship_files;
DROP POLICY IF EXISTS "Users can delete their own simulation fellowship files" ON public.simulation_fellowship_files;

CREATE POLICY "Users can view their own simulation fellowship files"
    ON public.simulation_fellowship_files FOR SELECT
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can insert their own simulation fellowship files"
    ON public.simulation_fellowship_files FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can update their own simulation fellowship files"
    ON public.simulation_fellowship_files FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can delete their own simulation fellowship files"
    ON public.simulation_fellowship_files FOR DELETE
    USING (auth.role() = 'service_role');

COMMENT ON TABLE public.simulation_fellowship_files IS 'Simulation Fellowship competency evidence — CTF and Admin only via API';
COMMENT ON COLUMN public.simulation_fellowship_files.requirement_key IS 'Fixed checklist key from lib/simulation-fellowship.ts';

-- Private storage bucket, same style as "IMT Portfolio".
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('Simulation Fellowship', 'Simulation Fellowship', false, 26214400)
ON CONFLICT (id) DO NOTHING;
