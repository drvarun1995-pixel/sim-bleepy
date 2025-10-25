-- Restore ONLY the REAL organizers that actually existed in your application
-- Based on IMPORT_SUMMARY.md and EXCEL-IMPORT-COMPLETE-SUMMARY.md
-- These are the ONLY 5 organizers that actually existed in your real data

-- Clear existing organizers first
DELETE FROM organizers;

-- Insert ONLY the actual organizers that existed in your real application data
INSERT INTO organizers (name) VALUES
-- These are the ONLY real organizers from your actual import data
('CTF Team'),
('Avni Patel'),
('Anirudh Suresh'),
('Simulation Team'),
('Pharmacy');

-- Update the organizers view if it exists
DROP VIEW IF EXISTS organizers_with_counts;
CREATE VIEW organizers_with_counts AS
SELECT 
    o.id,
    o.name,
    o.created_at,
    o.updated_at,
    0 as event_count  -- For now, set to 0 since we don't have event_organizers junction table
FROM organizers o
ORDER BY o.name;
