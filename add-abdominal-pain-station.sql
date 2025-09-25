-- Add Abdominal Pain station to the database
-- Run this script in your Supabase SQL Editor

-- Insert the abdominal pain station
INSERT INTO stations (slug, title) VALUES 
  ('abdominal-pain', 'Abdominal Pain Assessment')
ON CONFLICT (slug) DO NOTHING;

-- Verify the insertion
SELECT 
    slug,
    title
FROM stations 
WHERE slug = 'abdominal-pain';

-- Check all stations to confirm
SELECT 
    slug,
    title
FROM stations 
ORDER BY slug;
