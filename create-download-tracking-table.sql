-- Create download tracking table
CREATE TABLE IF NOT EXISTS public.download_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL,
    resource_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    user_name TEXT,
    download_timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    file_size BIGINT,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_download_tracking_resource_id ON public.download_tracking(resource_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_user_id ON public.download_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_timestamp ON public.download_tracking(download_timestamp);

-- Enable RLS
ALTER TABLE public.download_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all downloads
CREATE POLICY "Admins can view all downloads" ON public.download_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users can see their own downloads
CREATE POLICY "Users can view their own downloads" ON public.download_tracking
    FOR SELECT USING (user_id = auth.uid());

-- Anyone can insert download records (for tracking)
CREATE POLICY "Anyone can insert download records" ON public.download_tracking
    FOR INSERT WITH CHECK (true);

-- Function to get download count for a resource
CREATE OR REPLACE FUNCTION get_resource_download_count(resource_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.download_tracking 
        WHERE resource_id = resource_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT ON public.download_tracking TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_resource_download_count(UUID) TO authenticated, anon;
