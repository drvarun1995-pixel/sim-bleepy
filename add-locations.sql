-- =====================================================
-- REPLACE ALL LOCATIONS
-- =====================================================
-- This script removes all existing locations and adds only the needed ones

-- Delete all existing locations
DELETE FROM public.locations;

-- Add only the required locations
INSERT INTO public.locations (name) VALUES
    ('A1, Education Centre'),
    ('A2, Education Centre'),
    ('A3, Education Centre'),
    ('A4, Education Centre'),
    ('A5, Education Centre'),
    ('B2, Education Centre'),
    ('B3, Education Centre'),
    ('B4, Education Centre'),
    ('CTC Room 3'),
    ('Education Centre'),
    ('IS1, Education Centre'),
    ('KLT'),
    ('Simulation Suite'),
    ('Social Area'),
    ('Virtual');

-- =====================================================
-- VERIFY THE LOCATIONS WERE ADDED
-- =====================================================
SELECT 
    id,
    name,
    created_at
FROM public.locations
ORDER BY name;

-- Count of locations
SELECT COUNT(*) as total_locations FROM public.locations;




































