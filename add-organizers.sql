-- =====================================================
-- REPLACE ALL ORGANIZERS
-- =====================================================
-- This script removes all existing organizers and adds only the needed ones

-- Delete all existing organizers
DELETE FROM public.organizers;

-- Add only the required organizers
INSERT INTO public.organizers (name) VALUES
    ('Anirudh Suresh'),
    ('Avni Patel'),
    ('CTF Team'),
    ('Hannah-Maria Francis'),
    ('Pharmacy'),
    ('Simulation Team'),
    ('Thanuji Rangana'),
    ('Varun Tyagi');

-- =====================================================
-- VERIFY THE ORGANIZERS WERE ADDED
-- =====================================================
SELECT 
    id,
    name,
    created_at
FROM public.organizers
ORDER BY name;

-- Count of organizers
SELECT COUNT(*) as total_organizers FROM public.organizers;

