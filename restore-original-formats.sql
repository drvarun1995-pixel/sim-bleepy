-- Restore the original formats that existed in your application
-- Based on the IMPORT_SUMMARY.md and recreate-basic-database-structure.sql

-- Clear existing formats first
DELETE FROM event_formats;
DELETE FROM formats;

-- Insert the original formats with their colors
INSERT INTO formats (name, slug, description, color) VALUES
-- Core teaching formats
('OSCE Revision', 'osce-revision', 'OSCE preparation and revision sessions', '#84CC16'),
('Core Teachings', 'core-teachings', 'Core medical education sessions', '#8B5CF6'),
('Clinical Skills', 'clinical-skills', 'Hands-on clinical skills training', '#06B6D4'),
('Twilight Teaching', 'twilight-teaching', 'Evening teaching sessions', '#F59E0B'),

-- Practice sessions
('Obs & Gynae Practice Sessions', 'obs-gynae-practice-sessions', 'Obstetrics and Gynaecology practice sessions', '#EF4444'),
('Paeds Practice Sessions', 'paeds-practice-sessions', 'Paediatrics practice sessions', '#10B981'),
('A-E Practice Sessions', 'a-e-practice-sessions', 'Airway and Breathing practice sessions', '#8B5CF6'),

-- Specialized formats
('Virtual Reality Sessions', 'virtual-reality-sessions', 'VR-based medical training', '#06B6D4'),
('Grand Round', 'grand-round', 'Grand rounds and case presentations', '#EF4444'),
('Hub days', 'hub-days', 'Hub day activities and sessions', '#F59E0B'),
('Portfolio Drop-ins', 'portfolio-drop-ins', 'Portfolio support and guidance sessions', '#C44569'),
('Inductions', 'inductions', 'Induction and orientation sessions', '#84CC16'),
('Pharmacy Teaching', 'pharmacy-teaching', 'Pharmacy education sessions', '#10B981'),
('Bedside Teaching', 'bedside-teaching', 'Bedside clinical teaching', '#8B5CF6'),

-- Assessment formats
('Exams & Mocks', 'exams-mocks', 'Examination and mock assessment sessions', '#EF4444');

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


