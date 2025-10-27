-- =====================================================
-- TEACHING REQUESTS SYSTEM - Database Schema
-- =====================================================
-- This script creates the teaching_requests table and related structures
-- for managing teaching requests from users to administrators

-- Create teaching_requests table
CREATE TABLE IF NOT EXISTS public.teaching_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User information
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    
    -- Request details
    topic TEXT NOT NULL,
    description TEXT NOT NULL,
    additional_info TEXT,
    
    -- Scheduling preferences
    preferred_date DATE,
    preferred_time TIME,
    duration TEXT NOT NULL,
    
    -- Teaching content
    categories TEXT[] NOT NULL DEFAULT '{}',
    format TEXT NOT NULL,
    
    -- Status and tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'rejected')),
    
    -- Admin notes and tracking
    admin_notes TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    scheduled_date DATE,
    scheduled_time TIME,
    location TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teaching_requests_user_email ON public.teaching_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_status ON public.teaching_requests(status);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_categories ON public.teaching_requests USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_format ON public.teaching_requests(format);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_created_at ON public.teaching_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_assigned_to ON public.teaching_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_preferred_date ON public.teaching_requests(preferred_date);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_scheduled_date ON public.teaching_requests(scheduled_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_teaching_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teaching_requests_updated_at
    BEFORE UPDATE ON public.teaching_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_teaching_requests_updated_at();

-- Enable RLS
ALTER TABLE public.teaching_requests ENABLE ROW LEVEL SECURITY;

-- Create view for admin dashboard with user details
CREATE OR REPLACE VIEW public.teaching_requests_with_details AS
SELECT 
    tr.*,
    u.name as assigned_to_name,
    u.email as assigned_to_email,
    -- Format categories as readable text
    array_to_string(tr.categories, ', ') as categories_text,
    -- Calculate days until preferred date
    CASE 
        WHEN tr.preferred_date IS NOT NULL THEN 
            (tr.preferred_date - CURRENT_DATE)
        ELSE NULL
    END as days_until_preferred_date,
    -- Calculate days until scheduled date
    CASE 
        WHEN tr.scheduled_date IS NOT NULL THEN 
            (tr.scheduled_date - CURRENT_DATE)
        ELSE NULL
    END as days_until_scheduled_date
FROM public.teaching_requests tr
LEFT JOIN public.users u ON tr.assigned_to = u.id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teaching_requests TO authenticated;
GRANT SELECT ON public.teaching_requests_with_details TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert sample data (optional - remove in production)
INSERT INTO public.teaching_requests (
    user_email,
    user_name,
    topic,
    description,
    preferred_date,
    preferred_time,
    duration,
    categories,
    format,
    additional_info,
    status
) VALUES 
(
    'student@example.com',
    'John Student',
    'ECG Interpretation Workshop',
    'I would like to request a comprehensive ECG interpretation workshop for medical students. The session should cover basic rhythm recognition, common abnormalities, and case-based learning with real ECG examples.',
    '2024-02-15',
    '14:00:00',
    '2 hours',
    ARRAY['cardiology', 'diagnostics', 'clinical-skills'],
    'workshop',
    'We have access to a simulation lab with ECG machines and would prefer hands-on practice with real equipment.',
    'pending'
),
(
    'resident@example.com',
    'Dr. Sarah Resident',
    'Advanced Surgical Skills Training',
    'Request for an advanced surgical skills training session focusing on laparoscopic techniques. This should include both theoretical knowledge and practical hands-on training with simulation equipment.',
    '2024-02-20',
    '09:00:00',
    'full day (6-8 hours)',
    ARRAY['surgery', 'procedures', 'advanced-skills'],
    'hands-on-workshop',
    'We have 15 residents who would benefit from this training. Please include assessment rubrics and certification materials.',
    'in-progress'
),
(
    'fellow@example.com',
    'Dr. Michael Fellow',
    'Critical Care Case Studies',
    'I need a series of critical care case study sessions covering complex ICU scenarios, including sepsis management, ARDS protocols, and multi-organ failure cases.',
    '2024-02-25',
    '16:00:00',
    '1.5 hours',
    ARRAY['critical-care', 'case-studies', 'emergency-medicine'],
    'case-based-learning',
    'These sessions should be interactive with group discussions and evidence-based treatment protocols.',
    'completed'
);

-- Create helper function to get request statistics
CREATE OR REPLACE FUNCTION get_teaching_request_stats()
RETURNS TABLE (
    total_requests BIGINT,
    pending_requests BIGINT,
    in_progress_requests BIGINT,
    completed_requests BIGINT,
    rejected_requests BIGINT,
    recent_requests BIGINT,
    upcoming_scheduled BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_requests,
        COUNT(*) FILTER (WHERE scheduled_date >= CURRENT_DATE AND status IN ('pending', 'in-progress')) as upcoming_scheduled
    FROM public.teaching_requests;
END;
$$ LANGUAGE plpgsql;

-- Create function to update request status with timestamps
CREATE OR REPLACE FUNCTION update_teaching_request_status(
    request_id UUID,
    new_status TEXT,
    admin_notes TEXT DEFAULT NULL,
    assigned_to_user_id UUID DEFAULT NULL,
    scheduled_date_param DATE DEFAULT NULL,
    scheduled_time_param TIME DEFAULT NULL,
    location_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM public.teaching_requests
    WHERE id = request_id;
    
    -- Check if request exists
    IF current_status IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update the request
    UPDATE public.teaching_requests
    SET 
        status = new_status,
        admin_notes = COALESCE(admin_notes, admin_notes),
        assigned_to = COALESCE(assigned_to_user_id, assigned_to),
        scheduled_date = COALESCE(scheduled_date_param, scheduled_date),
        scheduled_time = COALESCE(scheduled_time_param, scheduled_time),
        location = COALESCE(location_param, location),
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
CREATE OR REPLACE FUNCTION get_user_teaching_requests(user_email_param TEXT)
RETURNS TABLE (
    id UUID,
    topic TEXT,
    description TEXT,
    preferred_date DATE,
    preferred_time TIME,
    duration TEXT,
    categories TEXT[],
    format TEXT,
    status TEXT,
    admin_notes TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.id,
        tr.topic,
        tr.description,
        tr.preferred_date,
        tr.preferred_time,
        tr.duration,
        tr.categories,
        tr.format,
        tr.status,
        tr.admin_notes,
        tr.scheduled_date,
        tr.scheduled_time,
        tr.location,
        tr.created_at,
        tr.updated_at
    FROM public.teaching_requests tr
    WHERE tr.user_email = user_email_param
    ORDER BY tr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to search requests
CREATE OR REPLACE FUNCTION search_teaching_requests(
    search_term TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    format_filter TEXT DEFAULT NULL,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_email TEXT,
    user_name TEXT,
    topic TEXT,
    description TEXT,
    preferred_date DATE,
    duration TEXT,
    categories TEXT[],
    format TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.id,
        tr.user_email,
        tr.user_name,
        tr.topic,
        tr.description,
        tr.preferred_date,
        tr.duration,
        tr.categories,
        tr.format,
        tr.status,
        tr.created_at
    FROM public.teaching_requests tr
    WHERE 
        (search_term IS NULL OR 
         tr.topic ILIKE '%' || search_term || '%' OR
         tr.user_name ILIKE '%' || search_term || '%' OR
         tr.user_email ILIKE '%' || search_term || '%' OR
         tr.description ILIKE '%' || search_term || '%')
        AND (status_filter IS NULL OR tr.status = status_filter)
        AND (category_filter IS NULL OR category_filter = ANY(tr.categories))
        AND (format_filter IS NULL OR tr.format = format_filter)
        AND (date_from IS NULL OR tr.created_at::date >= date_from)
        AND (date_to IS NULL OR tr.created_at::date <= date_to)
    ORDER BY tr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get requests by category
CREATE OR REPLACE FUNCTION get_teaching_requests_by_category(category_name TEXT)
RETURNS TABLE (
    id UUID,
    topic TEXT,
    user_name TEXT,
    preferred_date DATE,
    duration TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.id,
        tr.topic,
        tr.user_name,
        tr.preferred_date,
        tr.duration,
        tr.status,
        tr.created_at
    FROM public.teaching_requests tr
    WHERE category_name = ANY(tr.categories)
    ORDER BY tr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get upcoming scheduled requests
CREATE OR REPLACE FUNCTION get_upcoming_teaching_requests(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    id UUID,
    topic TEXT,
    user_name TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    duration TEXT,
    location TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.id,
        tr.topic,
        tr.user_name,
        tr.scheduled_date,
        tr.scheduled_time,
        tr.duration,
        tr.location,
        tr.status
    FROM public.teaching_requests tr
    WHERE 
        tr.scheduled_date IS NOT NULL
        AND tr.scheduled_date >= CURRENT_DATE
        AND tr.scheduled_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
        AND tr.status IN ('pending', 'in-progress')
    ORDER BY tr.scheduled_date, tr.scheduled_time;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.teaching_requests IS 'Stores teaching requests from users to administrators';
COMMENT ON COLUMN public.teaching_requests.user_email IS 'Email of the user making the request';
COMMENT ON COLUMN public.teaching_requests.user_name IS 'Name of the user making the request';
COMMENT ON COLUMN public.teaching_requests.topic IS 'Title or topic of the teaching session requested';
COMMENT ON COLUMN public.teaching_requests.description IS 'Detailed description of the teaching session requested';
COMMENT ON COLUMN public.teaching_requests.preferred_date IS 'User preferred date for the session';
COMMENT ON COLUMN public.teaching_requests.preferred_time IS 'User preferred time for the session';
COMMENT ON COLUMN public.teaching_requests.duration IS 'Requested duration of the session';
COMMENT ON COLUMN public.teaching_requests.categories IS 'Array of category IDs for the teaching content';
COMMENT ON COLUMN public.teaching_requests.format IS 'Teaching format (workshop, lecture, hands-on, etc.)';
COMMENT ON COLUMN public.teaching_requests.status IS 'Current status of the request (pending, in-progress, completed, rejected)';
COMMENT ON COLUMN public.teaching_requests.admin_notes IS 'Internal notes from administrators';
COMMENT ON COLUMN public.teaching_requests.assigned_to IS 'ID of the administrator assigned to handle this request';
COMMENT ON COLUMN public.teaching_requests.scheduled_date IS 'Confirmed scheduled date for the session';
COMMENT ON COLUMN public.teaching_requests.scheduled_time IS 'Confirmed scheduled time for the session';
COMMENT ON COLUMN public.teaching_requests.location IS 'Location where the session will be held';
COMMENT ON COLUMN public.teaching_requests.completed_at IS 'Timestamp when the request was completed';
COMMENT ON COLUMN public.teaching_requests.rejected_at IS 'Timestamp when the request was rejected';
COMMENT ON COLUMN public.teaching_requests.rejection_reason IS 'Reason for rejection (if applicable)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Teaching requests system created successfully!';
    RAISE NOTICE 'Table: teaching_requests';
    RAISE NOTICE 'View: teaching_requests_with_details';
    RAISE NOTICE 'Functions: get_teaching_request_stats, update_teaching_request_status, get_user_teaching_requests, search_teaching_requests, get_teaching_requests_by_category, get_upcoming_teaching_requests';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;
