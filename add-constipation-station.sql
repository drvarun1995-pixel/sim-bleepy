-- Add Constipation station to the stations table
-- Run this script in your Supabase SQL editor

-- Insert the constipation station
INSERT INTO stations (slug, title) VALUES 
  ('constipation', 'Constipation Assessment')
ON CONFLICT (slug) DO NOTHING;

-- Verify the addition
SELECT * FROM stations WHERE slug = 'constipation';

-- Show all stations
SELECT * FROM stations ORDER BY slug;

