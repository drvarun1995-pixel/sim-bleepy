-- Create resources table for file downloads with proper permissions system
-- Based on the original implementation with correct role-based access control

CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    teaching_date DATE,
    taught_by TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_by_name TEXT,
    views INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource_events junction table for linking resources to events
CREATE TABLE IF NOT EXISTS public.resource_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at);
CREATE INDEX IF NOT EXISTS idx_resources_is_active ON public.resources(is_active);
CREATE INDEX IF NOT EXISTS idx_resource_events_resource_id ON public.resource_events(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_events_event_id ON public.resource_events(event_id);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR RESOURCES TABLE
-- ============================================================================

-- 1. ALL authenticated users can VIEW active resources
CREATE POLICY "Allow all authenticated users to view active resources" ON public.resources
    FOR SELECT USING (is_active = true);

-- 2. UPLOAD: CTF, educator, meded_team, and admin can upload (NOT students)
CREATE POLICY "Allow CTF/educator/meded_team/admin to upload resources" ON public.resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('ctf', 'educator', 'meded_team', 'admin')
        )
    );

-- 3. UPDATE: Users can edit their own files, admins can edit any
CREATE POLICY "Allow users to edit own files or admin to edit any" ON public.resources
    FOR UPDATE USING (
        -- Admin can edit any file
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
        OR
        -- Non-admin users can only edit their own files
        (
            uploaded_by = auth.uid() AND
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('ctf', 'educator', 'meded_team')
            )
        )
    );

-- 4. DELETE: Users can delete their own files, admins can delete any
CREATE POLICY "Allow users to delete own files or admin to delete any" ON public.resources
    FOR DELETE USING (
        -- Admin can delete any file
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
        OR
        -- Non-admin users can only delete their own files
        (
            uploaded_by = auth.uid() AND
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('ctf', 'educator', 'meded_team')
            )
        )
    );

-- ============================================================================
-- RLS POLICIES FOR RESOURCE_EVENTS TABLE
-- ============================================================================

-- 1. ALL authenticated users can VIEW resource_events
CREATE POLICY "Allow all authenticated users to view resource_events" ON public.resource_events
    FOR SELECT USING (true);

-- 2. INSERT: CTF, educator, meded_team, and admin can link resources to events
CREATE POLICY "Allow CTF/educator/meded_team/admin to link resources to events" ON public.resource_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('ctf', 'educator', 'meded_team', 'admin')
        )
    );

-- 3. UPDATE: CTF, educator, meded_team, and admin can update links
CREATE POLICY "Allow CTF/educator/meded_team/admin to update resource_events" ON public.resource_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('ctf', 'educator', 'meded_team', 'admin')
        )
    );

-- 4. DELETE: CTF, educator, meded_team, and admin can delete links
CREATE POLICY "Allow CTF/educator/meded_team/admin to delete resource_events" ON public.resource_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('ctf', 'educator', 'meded_team', 'admin')
        )
    );

-- ============================================================================
-- STORAGE BUCKET POLICIES (to be added in Supabase Dashboard)
-- ============================================================================

/*
STORAGE POLICIES TO ADD IN SUPABASE DASHBOARD:

1. Allow CTF/educator/meded_team/admin to upload files:
CREATE POLICY "Allow CTF/educator/meded_team/admin uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('ctf', 'educator', 'meded_team', 'admin')
  )
);

2. Allow all authenticated users to download files:
CREATE POLICY "Allow authenticated downloads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resources');

3. Allow users to delete their own files or admin to delete any:
CREATE POLICY "Allow users to delete own files or admin to delete any"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resources' AND
  (
    -- Admin can delete any file
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
    OR
    -- Non-admin users can only delete files they uploaded
    (
      owner = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('ctf', 'educator', 'meded_team')
      )
    )
  )
);
*/

-- ============================================================================
-- UTILITY FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_resources_updated_at 
    BEFORE UPDATE ON public.resources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.resources TO authenticated;
GRANT ALL ON public.resource_events TO authenticated;

-- Add comments
COMMENT ON TABLE public.resources IS 'Stores metadata for uploaded resource files with proper role-based permissions';
COMMENT ON TABLE public.resource_events IS 'Junction table linking resources to events';

-- ============================================================================
-- PERMISSION SUMMARY
-- ============================================================================

/*
PERMISSION MATRIX:

┌─────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Action      │ Student │ CTF     │ Educator│ MedEd   │ Admin   │
├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ View Files  │    ✅   │    ✅   │    ✅   │    ✅   │    ✅   │
│ Download    │    ✅   │    ✅   │    ✅   │    ✅   │    ✅   │
│ Upload      │    ❌   │    ✅   │    ✅   │    ✅   │    ✅   │
│ Edit Own    │    ❌   │    ✅   │    ✅   │    ✅   │    ✅   │
│ Edit Others │    ❌   │    ❌   │    ❌   │    ❌   │    ✅   │
│ Delete Own  │    ❌   │    ✅   │    ✅   │    ✅   │    ✅   │
│ Delete Any  │    ❌   │    ❌   │    ❌   │    ❌   │    ✅   │
└─────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

KEY RULES:
1. Students can only view and download
2. CTF/Educator/MedEd_Team can upload and manage their own files
3. Admin can do everything (upload, edit any, delete any)
4. All authenticated users can view and download active resources
*/
