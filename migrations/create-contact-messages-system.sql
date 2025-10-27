-- ============================================================================
-- CONTACT MESSAGES SYSTEM - Complete Database Setup
-- ============================================================================
-- This script creates the complete contact messages system based on the existing
-- frontend implementation. It includes:
-- 1. contact_messages table with proper schema
-- 2. Proper indexes and RLS policies
-- 3. Helper functions for role-based access
-- 4. Sample data for testing
-- ============================================================================

-- ============================================================================
-- 1. CREATE CONTACT_MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    admin_notes TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for contact_messages table
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_category ON public.contact_messages(category);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_replied_at ON public.contact_messages(replied_at);

-- Composite index for admin queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created 
ON public.contact_messages(status, created_at DESC);

-- ============================================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contact_messages table
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER update_contact_messages_updated_at
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS FOR ROLE-BASED ACCESS
-- ============================================================================

-- Function to check if user can view contact messages
CREATE OR REPLACE FUNCTION public.can_view_contact_messages(user_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM public.users
    WHERE id = user_id;
    
    -- Check if user has permission to view contact messages
    -- Admin, MedEd Team, and CTF can view contact messages
    RETURN user_role IN ('admin', 'meded_team', 'ctf');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on contact_messages table
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'contact_messages'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.contact_messages', r.policyname);
    END LOOP;
END $$;

-- Policy 1: Anyone can insert contact messages (public contact form)
CREATE POLICY "Anyone can insert contact messages"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

-- Policy 2: Service role has full access (for API operations)
CREATE POLICY "Service role full access to contact messages"
    ON public.contact_messages FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Admin, MedEd Team, CTF can view all contact messages
CREATE POLICY "Admin MedEd CTF can view contact messages"
    ON public.contact_messages FOR SELECT
    USING (public.can_view_contact_messages(auth.uid()));

-- Policy 4: Admin, MedEd Team, CTF can update contact messages
CREATE POLICY "Admin MedEd CTF can update contact messages"
    ON public.contact_messages FOR UPDATE
    USING (public.can_view_contact_messages(auth.uid()))
    WITH CHECK (public.can_view_contact_messages(auth.uid()));

-- Policy 5: Admin, MedEd Team, CTF can delete contact messages
CREATE POLICY "Admin MedEd CTF can delete contact messages"
    ON public.contact_messages FOR DELETE
    USING (public.can_view_contact_messages(auth.uid()));

-- ============================================================================
-- 6. INSERT SAMPLE CONTACT MESSAGES (OPTIONAL)
-- ============================================================================

-- Insert sample contact messages for testing (only if no messages exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.contact_messages LIMIT 1) THEN
        -- Sample contact message 1
        INSERT INTO public.contact_messages (name, email, subject, category, message, status)
        VALUES (
            'John Smith',
            'john.smith@example.com',
            'Question about upcoming events',
            'General Inquiry',
            'Hi, I would like to know more about the upcoming medical education events. When will the next session be scheduled?',
            'new'
        );
        
        -- Sample contact message 2
        INSERT INTO public.contact_messages (name, email, subject, category, message, status, admin_notes)
        VALUES (
            'Dr. Sarah Johnson',
            'sarah.johnson@hospital.com',
            'Technical support needed',
            'Technical Issue',
            'I am having trouble accessing the learning resources section. The page keeps loading but never displays the content.',
            'read',
            'User reported loading issue - need to check CDN configuration'
        );
        
        -- Sample contact message 3
        INSERT INTO public.contact_messages (name, email, subject, category, message, status, admin_notes, replied_at)
        VALUES (
            'Mike Wilson',
            'mike.wilson@university.edu',
            'Request for additional materials',
            'Resource Request',
            'Could you please provide additional reading materials for the cardiology module?',
            'replied',
            'Sent additional resources via email',
            NOW() - INTERVAL '2 days'
        );
        
        -- Sample contact message 4
        INSERT INTO public.contact_messages (name, email, subject, category, message, status)
        VALUES (
            'Emily Davis',
            'emily.davis@student.org',
            'Feedback on the platform',
            'Feedback',
            'The platform is excellent! The interactive features really help with learning. Keep up the great work!',
            'archived'
        );
    END IF;
END $$;

-- ============================================================================
-- 7. CREATE VIEW FOR ADMIN DASHBOARD
-- ============================================================================

-- View for contact messages with status counts
CREATE OR REPLACE VIEW public.contact_messages_summary AS
SELECT 
    status,
    category,
    COUNT(*) as count,
    MAX(created_at) as latest_message
FROM public.contact_messages
GROUP BY status, category
ORDER BY status, category;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_messages' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ contact_messages table created successfully';
    ELSE
        RAISE NOTICE '❌ contact_messages table creation failed';
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
    AND tablename = 'contact_messages';
    
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
    AND tablename = 'contact_messages';
    
    IF policy_count >= 5 THEN
        RAISE NOTICE '✅ RLS policies created successfully (% found)', policy_count;
    ELSE
        RAISE NOTICE '❌ RLS policy creation may have failed (% found)', policy_count;
    END IF;
END $$;

-- Verify sample data
DO $$
DECLARE
    message_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO message_count
    FROM public.contact_messages;
    
    IF message_count >= 4 THEN
        RAISE NOTICE '✅ Sample data inserted successfully (% messages)', message_count;
    ELSE
        RAISE NOTICE '⚠️ Sample data may not have been inserted (% messages)', message_count;
    END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CONTACT MESSAGES SYSTEM SETUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created contact_messages table with proper schema';
    RAISE NOTICE '✅ Created performance indexes';
    RAISE NOTICE '✅ Set up RLS policies for security';
    RAISE NOTICE '✅ Created helper functions for role-based access';
    RAISE NOTICE '✅ Created admin dashboard view';
    RAISE NOTICE '✅ Added sample contact messages for testing';
    RAISE NOTICE '';
    RAISE NOTICE 'The contact messages system is now ready to use!';
    RAISE NOTICE 'Public users can submit messages via /contact';
    RAISE NOTICE 'Admin/MedEd/CTF users can manage messages via /contact-messages';
    RAISE NOTICE '';
END $$;




