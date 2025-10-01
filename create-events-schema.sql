-- =====================================================
-- EVENTS MANAGEMENT SYSTEM - COMPLETE SCHEMA SETUP
-- =====================================================
-- This script creates all tables and policies needed for the events management system
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (careful - this will delete data!)
DROP TABLE IF EXISTS public.event_speakers CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.formats CASCADE;
DROP TABLE IF EXISTS public.speakers CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.organizers CASCADE;

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster parent lookups
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

-- =====================================================
-- FORMATS TABLE
-- =====================================================
CREATE TABLE public.formats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.formats(id) ON DELETE SET NULL,
    description TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster parent lookups
CREATE INDEX idx_formats_parent ON public.formats(parent_id);

-- =====================================================
-- SPEAKERS TABLE (with roles)
-- =====================================================
CREATE TABLE public.speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LOCATIONS TABLE
-- =====================================================
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORGANIZERS TABLE
-- =====================================================
CREATE TABLE public.organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EVENTS TABLE
-- =====================================================
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    title TEXT NOT NULL,
    description TEXT,
    
    -- Date and Time
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    hide_time BOOLEAN DEFAULT false,
    hide_end_time BOOLEAN DEFAULT false,
    time_notes TEXT,
    
    -- Location
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    other_location_ids UUID[] DEFAULT ARRAY[]::UUID[],
    hide_location BOOLEAN DEFAULT false,
    
    -- Organizer
    organizer_id UUID REFERENCES public.organizers(id) ON DELETE SET NULL,
    other_organizer_ids UUID[] DEFAULT ARRAY[]::UUID[],
    hide_organizer BOOLEAN DEFAULT false,
    
    -- Category and Format
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    format_id UUID REFERENCES public.formats(id) ON DELETE SET NULL,
    
    -- Speakers
    hide_speakers BOOLEAN DEFAULT false,
    
    -- Event Links
    event_link TEXT,
    more_info_link TEXT,
    more_info_target TEXT CHECK (more_info_target IN ('current', 'new')) DEFAULT 'current',
    
    -- Event Status
    event_status TEXT CHECK (event_status IN ('scheduled', 'rescheduled', 'postponed', 'cancelled', 'moved-online')) DEFAULT 'scheduled',
    
    -- Metadata
    attendees INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'published', 'cancelled')) DEFAULT 'published',
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_category ON public.events(category_id);
CREATE INDEX idx_events_format ON public.events(format_id);
CREATE INDEX idx_events_location ON public.events(location_id);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_event_status ON public.events(event_status);
CREATE INDEX idx_events_author ON public.events(author_id);

-- =====================================================
-- EVENT_SPEAKERS JUNCTION TABLE (many-to-many relationship)
-- =====================================================
CREATE TABLE public.event_speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a speaker can't be added to the same event twice
    UNIQUE(event_id, speaker_id)
);

-- Add indexes for faster lookups
CREATE INDEX idx_event_speakers_event ON public.event_speakers(event_id);
CREATE INDEX idx_event_speakers_speaker ON public.event_speakers(speaker_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formats_updated_at BEFORE UPDATE ON public.formats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_speakers_updated_at BEFORE UPDATE ON public.speakers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizers_updated_at BEFORE UPDATE ON public.organizers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Categories are viewable by everyone"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update categories"
    ON public.categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete categories"
    ON public.categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Formats Policies
CREATE POLICY "Formats are viewable by everyone"
    ON public.formats FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert formats"
    ON public.formats FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update formats"
    ON public.formats FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete formats"
    ON public.formats FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Speakers Policies
CREATE POLICY "Speakers are viewable by everyone"
    ON public.speakers FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert speakers"
    ON public.speakers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update speakers"
    ON public.speakers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete speakers"
    ON public.speakers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Locations Policies
CREATE POLICY "Locations are viewable by everyone"
    ON public.locations FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert locations"
    ON public.locations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update locations"
    ON public.locations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete locations"
    ON public.locations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Organizers Policies
CREATE POLICY "Organizers are viewable by everyone"
    ON public.organizers FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert organizers"
    ON public.organizers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update organizers"
    ON public.organizers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete organizers"
    ON public.organizers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Events Policies
CREATE POLICY "Published events are viewable by everyone"
    ON public.events FOR SELECT
    USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Admins can insert events"
    ON public.events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update events"
    ON public.events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete events"
    ON public.events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Event Speakers Policies
CREATE POLICY "Event speakers are viewable by everyone"
    ON public.event_speakers FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage event speakers"
    ON public.event_speakers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View to get events with all related data
CREATE OR REPLACE VIEW public.events_with_details AS
SELECT 
    e.*,
    c.name as category_name,
    c.color as category_color,
    f.name as format_name,
    f.color as format_color,
    l.name as location_name,
    o.name as organizer_name,
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'role', s.role
            )
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'::json
    ) as speakers
FROM public.events e
LEFT JOIN public.categories c ON e.category_id = c.id
LEFT JOIN public.formats f ON e.format_id = f.id
LEFT JOIN public.locations l ON e.location_id = l.id
LEFT JOIN public.organizers o ON e.organizer_id = o.id
LEFT JOIN public.event_speakers es ON e.id = es.event_id
LEFT JOIN public.speakers s ON es.speaker_id = s.id
GROUP BY e.id, c.name, c.color, f.name, f.color, l.name, o.name;

-- View to get category counts
CREATE OR REPLACE VIEW public.categories_with_counts AS
SELECT 
    c.*,
    COUNT(e.id) as event_count
FROM public.categories c
LEFT JOIN public.events e ON c.id = e.category_id AND e.status = 'published'
GROUP BY c.id;

-- View to get format counts
CREATE OR REPLACE VIEW public.formats_with_counts AS
SELECT 
    f.*,
    COUNT(e.id) as event_count
FROM public.formats f
LEFT JOIN public.events e ON f.id = e.format_id AND e.status = 'published'
GROUP BY f.id;

-- =====================================================
-- SAMPLE DATA (Optional - remove if you don't want default data)
-- =====================================================

-- Insert default categories
INSERT INTO public.categories (name, slug, description, color) VALUES
    ('Medical Training', 'medical-training', 'Medical training events', '#FF6B6B'),
    ('Workshop', 'workshop', 'Interactive workshop sessions', '#48C9B0'),
    ('Conference', 'conference', 'Professional conferences', '#FFB366'),
    ('Seminar', 'seminar', 'Educational seminars', '#5D6D7E');

-- Insert default formats
INSERT INTO public.formats (name, slug, description, color) VALUES
    ('In-Person', 'in-person', 'Physical in-person events', '#FF6B6B'),
    ('Virtual', 'virtual', 'Online virtual events', '#48C9B0'),
    ('Hybrid', 'hybrid', 'Combined in-person and virtual', '#FFB366'),
    ('Online', 'online', 'Fully online events', '#5D6D7E');

-- Insert default locations
INSERT INTO public.locations (name) VALUES
    ('Main Conference Room'),
    ('Training Lab A'),
    ('Training Lab B'),
    ('Virtual Meeting Room'),
    ('Auditorium'),
    ('Board Room');

-- Insert default speakers
INSERT INTO public.speakers (name, role) VALUES
    ('Dr. Sarah Johnson', 'Keynote Speaker'),
    ('Dr. Michael Chen', 'Workshop Leader'),
    ('Dr. Emily Rodriguez', 'Panelist'),
    ('Dr. James Wilson', 'Moderator'),
    ('Dr. Lisa Thompson', 'Guest Speaker'),
    ('Dr. Robert Davis', 'Presenter');

-- Insert default organizers
INSERT INTO public.organizers (name) VALUES
    ('Medical Education Department'),
    ('Training Institute'),
    ('HR Department'),
    ('Professional Development'),
    ('Quality Assurance Team'),
    ('Clinical Services');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.formats TO anon, authenticated;
GRANT SELECT ON public.speakers TO anon, authenticated;
GRANT SELECT ON public.locations TO anon, authenticated;
GRANT SELECT ON public.organizers TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT ON public.event_speakers TO anon, authenticated;

-- Grant all permissions to authenticated users (controlled by RLS)
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.formats TO authenticated;
GRANT ALL ON public.speakers TO authenticated;
GRANT ALL ON public.locations TO authenticated;
GRANT ALL ON public.organizers TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.event_speakers TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.events_with_details TO anon, authenticated;
GRANT SELECT ON public.categories_with_counts TO anon, authenticated;
GRANT SELECT ON public.formats_with_counts TO anon, authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('categories', 'formats', 'speakers', 'locations', 'organizers', 'events', 'event_speakers')
ORDER BY tablename;

-- Check sample data
SELECT 'Categories' as table_name, COUNT(*) as count FROM public.categories
UNION ALL
SELECT 'Formats', COUNT(*) FROM public.formats
UNION ALL
SELECT 'Speakers', COUNT(*) FROM public.speakers
UNION ALL
SELECT 'Locations', COUNT(*) FROM public.locations
UNION ALL
SELECT 'Organizers', COUNT(*) FROM public.organizers
UNION ALL
SELECT 'Events', COUNT(*) FROM public.events;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Make sure you have a 'users' table with 'role' column for admin checks
-- 2. RLS policies assume admin users have role = 'admin' in the users table
-- 3. The slug fields are auto-generated from names in the frontend
-- 4. Array fields (other_location_ids, other_organizer_ids) store multiple selections
-- 5. The event_speakers junction table enables many-to-many relationships
-- 6. All timestamps use TIMESTAMP WITH TIME ZONE for proper timezone handling





