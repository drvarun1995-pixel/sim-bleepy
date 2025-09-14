-- Update stations table to include all three stations
-- Run this script in your Supabase SQL editor

-- Insert all stations (this will handle conflicts gracefully)
INSERT INTO stations (slug, title) VALUES 
  ('chest-pain', 'Chest Pain'),
  ('falls-assessment', 'Falls Assessment'),
  ('shortness-of-breath', 'Shortness of Breath Assessment')
ON CONFLICT (slug) DO NOTHING;

-- Verify the update
SELECT * FROM stations ORDER BY slug;
