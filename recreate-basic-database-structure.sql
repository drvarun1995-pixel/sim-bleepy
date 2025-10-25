-- BASIC DATABASE STRUCTURE RECREATION
-- This script recreates the basic tables needed for the events system
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create basic tables
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    parent TEXT,
    description TEXT,
    color TEXT DEFAULT '#FCD34D',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    parent TEXT,
    description TEXT,
    color TEXT DEFAULT '#FCD34D',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN DEFAULT FALSE,
    hide_time BOOLEAN DEFAULT FALSE,
    hide_end_time BOOLEAN DEFAULT FALSE,
    time_notes TEXT,
    location_id UUID REFERENCES locations(id),
    other_location_ids UUID[] DEFAULT '{}',
    hide_location BOOLEAN DEFAULT FALSE,
    organizer_id UUID REFERENCES organizers(id),
    other_organizer_ids UUID[] DEFAULT '{}',
    hide_organizer BOOLEAN DEFAULT FALSE,
    category_id UUID REFERENCES categories(id),
    format_id UUID REFERENCES formats(id),
    hide_speakers BOOLEAN DEFAULT FALSE,
    event_link TEXT,
    more_info_link TEXT,
    more_info_target TEXT DEFAULT 'current',
    event_status TEXT DEFAULT 'scheduled',
    attendees INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    author_id UUID,
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    -- Booking fields
    booking_enabled BOOLEAN DEFAULT FALSE,
    booking_button_label TEXT DEFAULT 'Register',
    booking_capacity INTEGER,
    booking_deadline_hours INTEGER DEFAULT 1,
    allow_waitlist BOOLEAN DEFAULT TRUE,
    confirmation_checkbox_1_text TEXT,
    confirmation_checkbox_1_required BOOLEAN DEFAULT TRUE,
    confirmation_checkbox_2_text TEXT,
    confirmation_checkbox_2_required BOOLEAN DEFAULT FALSE,
    cancellation_deadline_hours INTEGER DEFAULT 0,
    allowed_roles TEXT[],
    approval_mode TEXT DEFAULT 'auto',
    -- QR Code fields
    qr_attendance_enabled BOOLEAN DEFAULT FALSE,
    auto_generate_certificate BOOLEAN DEFAULT FALSE,
    certificate_generation_mode TEXT DEFAULT 'manual',
    feedback_required_for_certificate BOOLEAN DEFAULT FALSE,
    feedback_deadline_days INTEGER DEFAULT 7,
    certificate_template_id TEXT,
    certificate_auto_send_email BOOLEAN DEFAULT FALSE
);

-- Create junction tables
CREATE TABLE IF NOT EXISTS event_categories (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, category_id)
);

CREATE TABLE IF NOT EXISTS event_speakers (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, speaker_id)
);

-- Create views
CREATE OR REPLACE VIEW events_with_details AS
SELECT 
    e.*,
    l.name as location_name,
    l.address as location_address,
    l.latitude as location_latitude,
    l.longitude as location_longitude,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    f.name as format_name,
    f.color as format_color,
    f.slug as format_slug,
    o.name as organizer_name,
    u.name as user_name,
    u.email as user_email,
    u.role as user_role,
    COALESCE(
        ARRAY_AGG(
            DISTINCT jsonb_build_object(
                'id', ec_cat.id,
                'name', ec_cat.name,
                'color', ec_cat.color
            )
        ) FILTER (WHERE ec_cat.id IS NOT NULL),
        ARRAY[]::jsonb[]
    ) as junction_categories
FROM events e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN formats f ON e.format_id = f.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN users u ON e.author_id = u.id
LEFT JOIN event_categories ec ON e.id = ec.event_id
LEFT JOIN categories ec_cat ON ec.category_id = ec_cat.id
GROUP BY e.id, l.name, l.address, l.latitude, l.longitude, c.name, c.color, c.slug, f.name, f.color, f.slug, o.name, u.name, u.email, u.role;

-- Create some basic categories
INSERT INTO categories (name, slug, color) VALUES
('ARU', 'aru', '#3B82F6'),
('UCL', 'ucl', '#10B981'),
('Foundation Year Doctors', 'foundation-year-doctors', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-- Create some basic formats
INSERT INTO formats (name, slug, color) VALUES
('Grand Round', 'grand-round', '#EF4444'),
('Core Teaching', 'core-teaching', '#8B5CF6'),
('Twilight Teaching', 'twilight-teaching', '#06B6D4'),
('OSCE Revision', 'osce-revision', '#84CC16'),
('Portfolio Drop-ins', 'portfolio-drop-ins', '#C44569')
ON CONFLICT (name) DO NOTHING;

-- Create some basic locations
INSERT INTO locations (name, address) VALUES
('KLT', 'KLT Location'),
('Social Area', 'Post Graduate Centre, Basildon University Hospital, Basildon, UK'),
('Lecture Theatre', 'Main Lecture Theatre')
ON CONFLICT (name) DO NOTHING;

-- Create some basic organizers
INSERT INTO organizers (name) VALUES
('CTF Team'),
('Medical Education Team'),
('Clinical Skills Team')
ON CONFLICT (name) DO NOTHING;

-- Create some basic speakers
INSERT INTO speakers (name, role) VALUES
('Dr. Smith', 'Consultant'),
('Dr. Johnson', 'Registrar'),
('Dr. Brown', 'Specialist')
ON CONFLICT DO NOTHING;

-- Create some sample events
INSERT INTO events (title, date, start_time, end_time, location_id, organizer_id, category_id, format_id, status) VALUES
('Grand Round: Cardiology', '2025-11-01', '09:00:00', '10:00:00', 
 (SELECT id FROM locations WHERE name = 'KLT' LIMIT 1),
 (SELECT id FROM organizers WHERE name = 'CTF Team' LIMIT 1),
 (SELECT id FROM categories WHERE name = 'ARU' LIMIT 1),
 (SELECT id FROM formats WHERE name = 'Grand Round' LIMIT 1),
 'published'),
('Core Teaching: Emergency Medicine', '2025-11-02', '14:00:00', '15:00:00',
 (SELECT id FROM locations WHERE name = 'Lecture Theatre' LIMIT 1),
 (SELECT id FROM organizers WHERE name = 'Medical Education Team' LIMIT 1),
 (SELECT id FROM categories WHERE name = 'UCL' LIMIT 1),
 (SELECT id FROM formats WHERE name = 'Core Teaching' LIMIT 1),
 'published')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_format ON events(format_id);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_author ON events(author_id);

-- Create RLS policies (basic)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on formats" ON formats FOR ALL USING (true);
CREATE POLICY "Allow all operations on speakers" ON speakers FOR ALL USING (true);
CREATE POLICY "Allow all operations on locations" ON locations FOR ALL USING (true);
CREATE POLICY "Allow all operations on organizers" ON organizers FOR ALL USING (true);

-- Create views for counts
CREATE OR REPLACE VIEW categories_with_counts AS
SELECT 
    c.*,
    COUNT(e.id) as event_count
FROM categories c
LEFT JOIN events e ON c.id = e.category_id
GROUP BY c.id, c.name, c.slug, c.parent, c.description, c.color, c.created_at, c.updated_at;

CREATE OR REPLACE VIEW formats_with_counts AS
SELECT 
    f.*,
    COUNT(e.id) as event_count
FROM formats f
LEFT JOIN events e ON f.id = e.format_id
GROUP BY f.id, f.name, f.slug, f.parent, f.description, f.color, f.created_at, f.updated_at;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'DATABASE STRUCTURE RECREATED SUCCESSFULLY!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Created tables: events, categories, formats, speakers, locations, organizers';
  RAISE NOTICE 'Created views: events_with_details, categories_with_counts, formats_with_counts';
  RAISE NOTICE 'Created sample data: 3 categories, 5 formats, 3 locations, 3 organizers, 3 speakers, 2 events';
  RAISE NOTICE '=====================================================';
END $$;


