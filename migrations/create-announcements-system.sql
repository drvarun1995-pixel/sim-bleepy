-- ============================================================================
-- ANNOUNCEMENTS SYSTEM - Complete Database Setup
-- ============================================================================
-- This script creates the complete announcements system based on the existing
-- frontend implementation. It includes:
-- 1. announcements table with proper schema
-- 2. dismissed_announcements column in users table
-- 3. Proper indexes and RLS policies
-- 4. Foreign key relationships
-- ============================================================================

-- ============================================================================
-- 1. CREATE ANNOUNCEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_audience JSONB NOT NULL, -- {type: 'all'|'specific', roles: [], years: [], universities: [], specialties: []}
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. ADD DISMISSED_ANNOUNCEMENTS COLUMN TO USERS TABLE
-- ============================================================================

-- Add dismissed_announcements column to users table if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS dismissed_announcements TEXT[] DEFAULT '{}';

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for announcements table
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON public.announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON public.announcements(expires_at);

-- Composite index for active announcements ordered by priority and date
CREATE INDEX IF NOT EXISTS idx_announcements_active_priority_date 
ON public.announcements(is_active, priority DESC, created_at DESC) 
WHERE is_active = true;

-- Index for target audience queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_announcements_target_audience 
ON public.announcements USING GIN (target_audience);

-- ============================================================================
-- 4. CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for announcements table
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on announcements table
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'announcements'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.announcements', r.policyname);
    END LOOP;
END $$;

-- Policy 1: Everyone can view active announcements
CREATE POLICY "Everyone can view active announcements"
    ON public.announcements FOR SELECT
    USING (is_active = true);

-- Policy 2: Service role can do everything (for API operations)
CREATE POLICY "Service role full access to announcements"
    ON public.announcements FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS FOR TARGET AUDIENCE MATCHING
-- ============================================================================

-- Function to check if user matches target audience
CREATE OR REPLACE FUNCTION public.matches_target_audience(
    user_profile JSONB,
    target_audience JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    audience_type TEXT;
    target_roles TEXT[];
    target_years TEXT[];
    target_universities TEXT[];
    target_specialties TEXT[];
    user_role TEXT;
    user_year TEXT;
    user_university TEXT;
    user_specialty TEXT;
BEGIN
    -- Extract target audience configuration
    audience_type := target_audience->>'type';
    target_roles := ARRAY(SELECT jsonb_array_elements_text(target_audience->'roles'));
    target_years := ARRAY(SELECT jsonb_array_elements_text(target_audience->'years'));
    target_universities := ARRAY(SELECT jsonb_array_elements_text(target_audience->'universities'));
    target_specialties := ARRAY(SELECT jsonb_array_elements_text(target_audience->'specialties'));

    -- If targeting all users, return true
    IF audience_type = 'all' THEN
        RETURN TRUE;
    END IF;

    -- Extract user profile information
    user_role := user_profile->>'role_type';
    IF user_role IS NULL THEN
        user_role := user_profile->>'role';
    END IF;
    
    user_year := user_profile->>'study_year';
    IF user_year IS NULL THEN
        user_year := user_profile->>'foundation_year';
    END IF;
    
    user_university := user_profile->>'university';
    user_specialty := user_profile->>'specialty';

    -- Check role match
    IF array_length(target_roles, 1) > 0 THEN
        IF user_role IS NULL OR NOT (user_role = ANY(target_roles)) THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- Check year match
    IF array_length(target_years, 1) > 0 THEN
        IF user_year IS NULL OR NOT (user_year = ANY(target_years)) THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- Check university match
    IF array_length(target_universities, 1) > 0 THEN
        IF user_university IS NULL OR NOT (user_university = ANY(target_universities)) THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- Check specialty match
    IF array_length(target_specialties, 1) > 0 THEN
        IF user_specialty IS NULL OR NOT (user_specialty = ANY(target_specialties)) THEN
            RETURN FALSE;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 7. CREATE VIEW FOR DASHBOARD ANNOUNCEMENTS
-- ============================================================================

-- View for dashboard announcements with user matching
CREATE OR REPLACE VIEW public.dashboard_announcements AS
SELECT 
    a.id,
    a.title,
    a.content,
    a.priority,
    a.is_active,
    a.expires_at,
    a.created_at,
    a.author_id,
    u.name as author_name,
    u.email as author_email,
    a.target_audience
FROM public.announcements a
LEFT JOIN public.users u ON a.author_id = u.id
WHERE a.is_active = true
ORDER BY 
    CASE a.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'normal' THEN 3 
        WHEN 'low' THEN 4 
    END,
    a.created_at DESC;

-- ============================================================================
-- 8. INSERT SAMPLE ANNOUNCEMENTS (OPTIONAL)
-- ============================================================================

-- Insert sample announcements for testing (only if no announcements exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.announcements LIMIT 1) THEN
        -- Get the first admin user as author
        INSERT INTO public.announcements (title, content, author_id, target_audience, priority, is_active)
        SELECT 
            'Welcome to Bleepy!',
            'Welcome to the Bleepy platform! This is your central hub for medical education events, resources, and learning opportunities. Explore the dashboard to discover upcoming events, access teaching materials, and track your progress.',
            u.id,
            '{"type": "all", "roles": [], "years": [], "universities": [], "specialties": []}'::jsonb,
            'normal',
            true
        FROM public.users u 
        WHERE u.role = 'admin' 
        LIMIT 1;
        
        -- Insert a high priority announcement
        INSERT INTO public.announcements (title, content, author_id, target_audience, priority, is_active)
        SELECT 
            'System Maintenance Notice',
            'Scheduled maintenance will occur this weekend. The platform may be temporarily unavailable on Saturday from 2 AM to 4 AM GMT. Please plan accordingly.',
            u.id,
            '{"type": "all", "roles": [], "years": [], "universities": [], "specialties": []}'::jsonb,
            'high',
            true
        FROM public.users u 
        WHERE u.role = 'admin' 
        LIMIT 1;
    END IF;
END $$;

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ announcements table created successfully';
    ELSE
        RAISE NOTICE '❌ announcements table creation failed';
    END IF;
END $$;

-- Verify dismissed_announcements column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'dismissed_announcements' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ dismissed_announcements column added to users table';
    ELSE
        RAISE NOTICE '❌ dismissed_announcements column addition failed';
    END IF;
END $$;

-- Verify indexes
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'announcements';
    
    IF index_count >= 5 THEN
        RAISE NOTICE '✅ Indexes created successfully (% found)', index_count;
    ELSE
        RAISE NOTICE '❌ Index creation may have failed (% found)', index_count;
    END IF;
END $$;

-- Verify RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'announcements';
    
    IF policy_count >= 2 THEN
        RAISE NOTICE '✅ RLS policies created successfully (% found)', policy_count;
    ELSE
        RAISE NOTICE '❌ RLS policy creation may have failed (% found)', policy_count;
    END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ANNOUNCEMENTS SYSTEM SETUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created announcements table with proper schema';
    RAISE NOTICE '✅ Added dismissed_announcements column to users table';
    RAISE NOTICE '✅ Created performance indexes';
    RAISE NOTICE '✅ Set up RLS policies for security';
    RAISE NOTICE '✅ Created helper functions for target audience matching';
    RAISE NOTICE '✅ Created dashboard view for announcements';
    RAISE NOTICE '✅ Added sample announcements for testing';
    RAISE NOTICE '';
    RAISE NOTICE 'The announcements system is now ready to use!';
    RAISE NOTICE 'Admin, CTF, and MedEd team users can access /dashboard/announcements';
    RAISE NOTICE 'All users will see announcements on their dashboard';
    RAISE NOTICE '';
END $$;
