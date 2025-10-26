-- Create resources table for file downloads
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

-- Create RLS policies for resources table
-- Allow all authenticated users to read active resources
CREATE POLICY "Allow read access to active resources" ON public.resources
    FOR SELECT USING (is_active = true);

-- Allow admins and educators to insert resources
CREATE POLICY "Allow admins and educators to insert resources" ON public.resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Allow admins and educators to update resources
CREATE POLICY "Allow admins and educators to update resources" ON public.resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Allow admins and educators to delete resources
CREATE POLICY "Allow admins and educators to delete resources" ON public.resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Create RLS policies for resource_events table
-- Allow all authenticated users to read resource_events
CREATE POLICY "Allow read access to resource_events" ON public.resource_events
    FOR SELECT USING (true);

-- Allow admins and educators to insert resource_events
CREATE POLICY "Allow admins and educators to insert resource_events" ON public.resource_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Allow admins and educators to update resource_events
CREATE POLICY "Allow admins and educators to update resource_events" ON public.resource_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

-- Allow admins and educators to delete resource_events
CREATE POLICY "Allow admins and educators to delete resource_events" ON public.resource_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'educator')
        )
    );

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

-- Create a view for resources with download counts (if needed)
CREATE OR REPLACE VIEW public.resources_with_downloads AS
SELECT 
    r.*,
    COALESCE(dc.download_count, 0) as download_count
FROM public.resources r
LEFT JOIN (
    SELECT 
        resource_id,
        COUNT(*) as download_count
    FROM public.resource_events
    GROUP BY resource_id
) dc ON r.id = dc.resource_id
WHERE r.is_active = true;

-- Grant necessary permissions
GRANT ALL ON public.resources TO authenticated;
GRANT ALL ON public.resource_events TO authenticated;
GRANT ALL ON public.resources_with_downloads TO authenticated;

-- Insert some sample data to test (optional - remove if not needed)
-- INSERT INTO public.resources (title, description, category, file_name, file_path, file_url, file_size, file_type, uploaded_by_name) VALUES
-- ('Sample PDF', 'This is a sample PDF file', 'bedside-teaching', 'sample.pdf', 'bedside-teaching/sample.pdf', 'https://example.com/sample.pdf', 1024, 'application/pdf', 'Admin User'),
-- ('Sample Video', 'This is a sample video file', 'clinical-skills', 'sample.mp4', 'clinical-skills/sample.mp4', 'https://example.com/sample.mp4', 2048, 'video/mp4', 'Admin User');

COMMENT ON TABLE public.resources IS 'Stores metadata for uploaded resource files';
COMMENT ON TABLE public.resource_events IS 'Junction table linking resources to events';
COMMENT ON VIEW public.resources_with_downloads IS 'Resources view with download counts';
