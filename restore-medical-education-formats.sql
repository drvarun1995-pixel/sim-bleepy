-- Restore typical medical education formats based on your Sim-Bleepy medical education platform
-- These are the most common formats used in medical education programs

-- Clear existing formats first
DELETE FROM event_formats;
DELETE FROM formats;

-- Insert typical medical education formats with appropriate colors
INSERT INTO formats (name, slug, description, color) VALUES
-- Core Teaching Formats
('Grand Round', 'grand-round', 'Grand rounds and case presentations', '#EF4444'),
('Core Teaching', 'core-teaching', 'Core medical education sessions', '#8B5CF6'),
('Twilight Teaching', 'twilight-teaching', 'Evening teaching sessions', '#F59E0B'),
('Bedside Teaching', 'bedside-teaching', 'Bedside clinical teaching', '#10B981'),

-- Clinical Skills & Practice
('Clinical Skills', 'clinical-skills', 'Hands-on clinical skills training', '#06B6D4'),
('OSCE Practice', 'osce-practice', 'OSCE preparation and practice sessions', '#84CC16'),
('Simulation', 'simulation', 'Simulation-based learning sessions', '#8B5CF6'),

-- Specialty Practice Sessions
('A-E Practice', 'a-e-practice', 'Airway and Breathing practice sessions', '#EF4444'),
('Obs & Gynae Practice', 'obs-gynae-practice', 'Obstetrics and Gynaecology practice', '#EC4899'),
('Paediatrics Practice', 'paediatrics-practice', 'Paediatrics practice sessions', '#10B981'),

-- Assessment & Exams
('Mock Exams', 'mock-exams', 'Mock examination sessions', '#F59E0B'),
('Portfolio Drop-in', 'portfolio-drop-in', 'Portfolio support and guidance', '#C44569'),

-- Specialized Sessions
('Pharmacy Teaching', 'pharmacy-teaching', 'Pharmacy education sessions', '#06B6D4'),
('Induction', 'induction', 'Induction and orientation sessions', '#84CC16'),
('Hub Day', 'hub-day', 'Hub day activities and sessions', '#F59E0B'),

-- Virtual/Online Formats
('Virtual Session', 'virtual-session', 'Online virtual teaching sessions', '#8B5CF6'),
('Hybrid Session', 'hybrid-session', 'Combined in-person and virtual sessions', '#06B6D4');

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


