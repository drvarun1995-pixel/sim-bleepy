-- Restore the basic locations that were actually in your database structure
-- Based on recreate-basic-database-structure.sql

-- Clear existing locations first
DELETE FROM locations;

-- Insert the basic locations that were actually in your database structure
INSERT INTO locations (name, address) VALUES
('KLT', 'KLT Location'),
('Social Area', 'Post Graduate Centre, Basildon University Hospital, Basildon, UK'),
('Lecture Theatre', 'Main Lecture Theatre');

-- Update the locations view if it exists
DROP VIEW IF EXISTS locations_with_counts;
CREATE VIEW locations_with_counts AS
SELECT 
    l.id,
    l.name,
    l.address,
    l.created_at,
    l.updated_at,
    0 as event_count  -- For now, set to 0 since we don't have event_locations junction table
FROM locations l
ORDER BY l.name;


