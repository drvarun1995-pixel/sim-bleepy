-- Update stations table to include the renamed Joint Pain Assessment station
-- Run this script in your Supabase SQL editor

-- Insert the new joint pain assessment station
INSERT INTO stations (slug, title) VALUES 
  ('joint-pain-assessment', 'Joint Pain Assessment')
ON CONFLICT (slug) DO NOTHING;

-- If you had the old psoriatic arthritis station in your database, remove it
-- (Only run this if you actually had the old station in your database)
-- DELETE FROM stations WHERE slug = 'psoriatic-arthritis';

-- Verify the update
SELECT * FROM stations ORDER BY slug;



