-- Restore the actual formats that were in your basic database structure
-- Based on recreate-basic-database-structure.sql

-- Clear existing formats first
DELETE FROM event_formats;
DELETE FROM formats;

-- Insert the actual formats that were in your basic database structure
INSERT INTO formats (name, slug, description, color) VALUES
('Grand Round', 'grand-round', 'Grand rounds and case presentations', '#EF4444'),
('Core Teaching', 'core-teaching', 'Core medical education sessions', '#8B5CF6'),
('Twilight Teaching', 'twilight-teaching', 'Evening teaching sessions', '#06B6D4'),
('OSCE Revision', 'osce-revision', 'OSCE preparation and revision sessions', '#84CC16'),
('Portfolio Drop-ins', 'portfolio-drop-ins', 'Portfolio support and guidance sessions', '#C44569');

-- Update the formats_with_counts view
DROP VIEW IF EXISTS formats_with_counts;
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


