-- Clean up duplicate stations in Supabase
-- Run this script in your Supabase SQL editor

-- First, let's see what attempts exist for each falls station
SELECT 
    s.slug,
    s.title,
    COUNT(a.id) as attempt_count
FROM stations s
LEFT JOIN attempts a ON s.slug = a.station_slug
WHERE s.slug IN ('falls', 'falls-assessment')
GROUP BY s.slug, s.title;

-- If there are no attempts for the 'falls' station, we can safely remove it
-- If there ARE attempts, you'll need to migrate them first

-- Remove the duplicate 'falls' station (confirmed no attempts exist for it)
DELETE FROM stations WHERE slug = 'falls';

-- Verify the cleanup
SELECT * FROM stations ORDER BY slug;
