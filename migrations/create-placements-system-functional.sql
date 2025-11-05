-- =====================================================
-- CREATE PLACEMENTS SYSTEM (FUNCTIONAL)
-- =====================================================
-- This migration creates the placements system tables
-- RLS is disabled initially to make it functional
-- Run the RLS policies script separately after this
-- =====================================================

BEGIN;

-- 1. Create specialties table
CREATE TABLE IF NOT EXISTS specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create specialty_pages table (sub-pages for each specialty)
CREATE TABLE IF NOT EXISTS specialty_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(specialty_id, slug)
);

-- 3. Create specialty_documents table (documents for specialties or specialty pages)
CREATE TABLE IF NOT EXISTS specialty_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
    specialty_page_id UUID REFERENCES specialty_pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure at least one of specialty_id or specialty_page_id is set
    CHECK (
        (specialty_id IS NOT NULL AND specialty_page_id IS NULL) OR
        (specialty_id IS NULL AND specialty_page_id IS NOT NULL) OR
        (specialty_id IS NOT NULL AND specialty_page_id IS NOT NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_specialties_slug ON specialties(slug);
CREATE INDEX IF NOT EXISTS idx_specialties_active ON specialties(is_active);
CREATE INDEX IF NOT EXISTS idx_specialty_pages_specialty_id ON specialty_pages(specialty_id);
CREATE INDEX IF NOT EXISTS idx_specialty_pages_slug ON specialty_pages(slug);
CREATE INDEX IF NOT EXISTS idx_specialty_documents_specialty_id ON specialty_documents(specialty_id);
CREATE INDEX IF NOT EXISTS idx_specialty_documents_specialty_page_id ON specialty_documents(specialty_page_id);

-- Enable Row Level Security (will be configured in next script)
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialty_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialty_documents ENABLE ROW LEVEL SECURITY;

-- Insert initial specialty: Rheumatology
INSERT INTO specialties (name, slug, description, display_order)
VALUES ('Rheumatology', 'rheumatology', 'Rheumatology specialty information and resources', 1)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Placements system tables created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - specialties';
  RAISE NOTICE '  - specialty_pages';
  RAISE NOTICE '  - specialty_documents';
  RAISE NOTICE '';
  RAISE NOTICE 'Initial specialty added: Rheumatology';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  RLS is enabled but no policies are set yet.';
  RAISE NOTICE '    Run the RLS policies script next!';
END $$;

