-- Create download_tracking table for comprehensive download analytics
CREATE TABLE IF NOT EXISTS public.download_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    resource_name TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    ip_address TEXT,
    user_agent TEXT,
    file_size BIGINT,
    file_type TEXT,
    download_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional analytics fields
    session_id TEXT, -- For tracking user sessions
    referrer TEXT, -- Where the download was initiated from
    download_method TEXT DEFAULT 'direct', -- direct, bulk, api, etc.
    download_status TEXT DEFAULT 'completed', -- completed, failed, cancelled
    download_duration_ms INTEGER, -- How long the download took
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance and analytics queries
CREATE INDEX IF NOT EXISTS idx_download_tracking_resource_id ON public.download_tracking(resource_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_user_id ON public.download_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_timestamp ON public.download_tracking(download_timestamp);
CREATE INDEX IF NOT EXISTS idx_download_tracking_user_email ON public.download_tracking(user_email);
CREATE INDEX IF NOT EXISTS idx_download_tracking_file_type ON public.download_tracking(file_type);
CREATE INDEX IF NOT EXISTS idx_download_tracking_download_method ON public.download_tracking(download_method);
CREATE INDEX IF NOT EXISTS idx_download_tracking_status ON public.download_tracking(download_status);
CREATE INDEX IF NOT EXISTS idx_download_tracking_created_at ON public.download_tracking(created_at);

-- Enable RLS
ALTER TABLE public.download_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for download_tracking
-- Users can view their own download history
CREATE POLICY "Users can view their own download history" ON public.download_tracking
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR 
        auth.jwt() ->> 'email' = user_email
    );

-- Users can insert their own download records
CREATE POLICY "Users can track their own downloads" ON public.download_tracking
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text OR 
        auth.jwt() ->> 'email' = user_email
    );

-- Admins can view all download tracking data
CREATE POLICY "Admins can view all download tracking" ON public.download_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can delete download tracking data
CREATE POLICY "Admins can delete download tracking" ON public.download_tracking
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_download_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.download_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_download_tracking_updated_at
    BEFORE UPDATE ON public.download_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_download_tracking_updated_at();
