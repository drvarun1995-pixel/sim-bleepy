-- =====================================================
-- FILE REQUESTS SYSTEM - Database Schema
-- =====================================================
-- This script creates the file_requests table and related structures
-- for managing file requests from users to administrators

-- Create file_requests table
CREATE TABLE IF NOT EXISTS public.file_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User information
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    
    -- Request details
    file_name TEXT NOT NULL,
    description TEXT NOT NULL,
    additional_info TEXT,
    
    -- Event information
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    event_title TEXT NOT NULL,
    event_date DATE,
    
    -- Status and tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'rejected')),
    
    -- Admin notes and tracking
    admin_notes TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_requests_user_email ON public.file_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_file_requests_status ON public.file_requests(status);
CREATE INDEX IF NOT EXISTS idx_file_requests_event_id ON public.file_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_file_requests_created_at ON public.file_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_file_requests_assigned_to ON public.file_requests(assigned_to);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_file_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_file_requests_updated_at
    BEFORE UPDATE ON public.file_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_file_requests_updated_at();

-- Enable RLS
ALTER TABLE public.file_requests ENABLE ROW LEVEL SECURITY;

-- Create view for admin dashboard with user details
CREATE OR REPLACE VIEW public.file_requests_with_details AS
SELECT 
    fr.*,
    u.name as assigned_to_name,
    u.email as assigned_to_email,
    e.title as event_title_full,
    e.date as event_date_full,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    l.name as event_location
FROM public.file_requests fr
LEFT JOIN public.users u ON fr.assigned_to = u.id
LEFT JOIN public.events e ON fr.event_id = e.id
LEFT JOIN public.locations l ON e.location_id = l.id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_requests TO authenticated;
GRANT SELECT ON public.file_requests_with_details TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert sample data (optional - remove in production)
INSERT INTO public.file_requests (
    user_email,
    user_name,
    file_name,
    description,
    additional_info,
    event_title,
    event_date,
    status
) VALUES 
(
    'student@example.com',
    'John Student',
    'Cardiology Grand Round Slides',
    'I would like to request the PowerPoint slides from the Cardiology Grand Round session that took place last week. I missed the session due to clinical duties and would like to review the material.',
    'Please include any handouts or additional resources that were distributed during the session.',
    'Cardiology Grand Round - Heart Failure Management',
    '2024-01-15',
    'pending'
),
(
    'resident@example.com',
    'Dr. Sarah Resident',
    'ECG Interpretation Workshop Materials',
    'Could I please get access to the ECG interpretation workshop materials? I attended the session but would like to review the practice cases and answer keys.',
    'I am preparing for my cardiology rotation and these materials would be very helpful.',
    'ECG Interpretation Workshop',
    '2024-01-20',
    'in-progress'
),
(
    'fellow@example.com',
    'Dr. Michael Fellow',
    'Surgery Simulation Lab Resources',
    'I need the simulation lab resources from the surgical skills workshop. This includes the procedure checklists and assessment rubrics.',
    'I am organizing a similar workshop for junior residents and need these as reference materials.',
    'Advanced Surgical Skills Workshop',
    '2024-01-25',
    'completed'
);

-- Create helper function to get request statistics
CREATE OR REPLACE FUNCTION get_file_request_stats()
RETURNS TABLE (
    total_requests BIGINT,
    pending_requests BIGINT,
    in_progress_requests BIGINT,
    completed_requests BIGINT,
    rejected_requests BIGINT,
    recent_requests BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_requests
    FROM public.file_requests;
END;
$$ LANGUAGE plpgsql;

-- Create function to update request status with timestamps
CREATE OR REPLACE FUNCTION update_file_request_status(
    request_id UUID,
    new_status TEXT,
    admin_notes TEXT DEFAULT NULL,
    assigned_to_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM public.file_requests
    WHERE id = request_id;
    
    -- Check if request exists
    IF current_status IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update the request
    UPDATE public.file_requests
    SET 
        status = new_status,
        admin_notes = COALESCE(admin_notes, admin_notes),
        assigned_to = COALESCE(assigned_to_user_id, assigned_to),
        completed_at = CASE 
            WHEN new_status = 'completed' AND current_status != 'completed' THEN NOW()
            ELSE completed_at
        END,
        rejected_at = CASE 
            WHEN new_status = 'rejected' AND current_status != 'rejected' THEN NOW()
            ELSE rejected_at
        END,
        updated_at = NOW()
    WHERE id = request_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get requests by user
CREATE OR REPLACE FUNCTION get_user_file_requests(user_email_param TEXT)
RETURNS TABLE (
    id UUID,
    file_name TEXT,
    description TEXT,
    additional_info TEXT,
    event_title TEXT,
    event_date DATE,
    status TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fr.id,
        fr.file_name,
        fr.description,
        fr.additional_info,
        fr.event_title,
        fr.event_date,
        fr.status,
        fr.admin_notes,
        fr.created_at,
        fr.updated_at
    FROM public.file_requests fr
    WHERE fr.user_email = user_email_param
    ORDER BY fr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to search requests
CREATE OR REPLACE FUNCTION search_file_requests(
    search_term TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_email TEXT,
    user_name TEXT,
    file_name TEXT,
    description TEXT,
    event_title TEXT,
    event_date DATE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fr.id,
        fr.user_email,
        fr.user_name,
        fr.file_name,
        fr.description,
        fr.event_title,
        fr.event_date,
        fr.status,
        fr.created_at
    FROM public.file_requests fr
    WHERE 
        (search_term IS NULL OR 
         fr.file_name ILIKE '%' || search_term || '%' OR
         fr.user_name ILIKE '%' || search_term || '%' OR
         fr.user_email ILIKE '%' || search_term || '%' OR
         fr.description ILIKE '%' || search_term || '%')
        AND (status_filter IS NULL OR fr.status = status_filter)
        AND (date_from IS NULL OR fr.created_at::date >= date_from)
        AND (date_to IS NULL OR fr.created_at::date <= date_to)
    ORDER BY fr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.file_requests IS 'Stores file requests from users to administrators';
COMMENT ON COLUMN public.file_requests.user_email IS 'Email of the user making the request';
COMMENT ON COLUMN public.file_requests.user_name IS 'Name of the user making the request';
COMMENT ON COLUMN public.file_requests.file_name IS 'Name or title of the requested file';
COMMENT ON COLUMN public.file_requests.description IS 'Detailed description of what the user is looking for';
COMMENT ON COLUMN public.file_requests.additional_info IS 'Additional information or special requirements';
COMMENT ON COLUMN public.file_requests.event_id IS 'ID of the related event (if applicable)';
COMMENT ON COLUMN public.file_requests.event_title IS 'Title of the related event';
COMMENT ON COLUMN public.file_requests.event_date IS 'Date of the related event';
COMMENT ON COLUMN public.file_requests.status IS 'Current status of the request (pending, in-progress, completed, rejected)';
COMMENT ON COLUMN public.file_requests.admin_notes IS 'Internal notes from administrators';
COMMENT ON COLUMN public.file_requests.assigned_to IS 'ID of the administrator assigned to handle this request';
COMMENT ON COLUMN public.file_requests.completed_at IS 'Timestamp when the request was completed';
COMMENT ON COLUMN public.file_requests.rejected_at IS 'Timestamp when the request was rejected';
COMMENT ON COLUMN public.file_requests.rejection_reason IS 'Reason for rejection (if applicable)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'File requests system created successfully!';
    RAISE NOTICE 'Table: file_requests';
    RAISE NOTICE 'View: file_requests_with_details';
    RAISE NOTICE 'Functions: get_file_request_stats, update_file_request_status, get_user_file_requests, search_file_requests';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;
