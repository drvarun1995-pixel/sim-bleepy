-- Restore ALL the locations that actually existed in your application
-- Based on IMPORT_SUMMARY.md and EXCEL-IMPORT-COMPLETE-SUMMARY.md

-- Clear existing locations first
DELETE FROM locations;

-- Insert ALL the actual locations that existed in your application
INSERT INTO locations (name, address) VALUES
-- Education Centre Rooms
('B4, Education Centre', 'B4, Education Centre, Basildon University Hospital'),
('A5, Education Centre', 'A5, Education Centre, Basildon University Hospital'),
('A1, Education Centre', 'A1, Education Centre, Basildon University Hospital'),
('A3, Education Centre', 'A3, Education Centre, Basildon University Hospital'),
('A2, Education Centre', 'A2, Education Centre, Basildon University Hospital'),
('IS1, Education Centre', 'IS1, Education Centre, Basildon University Hospital'),

-- Specialized Locations
('Simulation Suite', 'Simulation Suite, Basildon University Hospital'),
('Virtual', 'Online Virtual Event'),
('KLT', 'KLT, Basildon University Hospital'),
('CTC Room 3', 'CTC Room 3, Basildon University Hospital'),
('Social Area', 'Post Graduate Centre, Basildon University Hospital, Basildon, UK');

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


