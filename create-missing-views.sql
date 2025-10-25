-- Create missing views for the API endpoints

-- Drop the view if it exists, then create it
DROP VIEW IF EXISTS formats_with_counts;

-- Create formats_with_counts view
CREATE VIEW formats_with_counts AS
SELECT 
    f.id,
    f.name,
    f.slug,
    f.parent,
    f.description,
    f.color,
    f.created_at,
    f.updated_at,
    0 as event_count  -- For now, set to 0 since we don't have event_formats junction table
FROM formats f
ORDER BY f.name;
