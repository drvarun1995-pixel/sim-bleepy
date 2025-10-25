-- Restore ALL the formats that actually existed in your application
-- Based on the formatMapping in components/dashboard/WeekFilesWidget.tsx and app/downloads/page.tsx

-- Clear existing formats first
DELETE FROM formats;

-- Insert ALL the actual formats that existed in your application
INSERT INTO formats (name, slug, description, color) VALUES
-- Core Teaching Formats
('Grand Round', 'grand-round', 'Grand rounds and case presentations', '#f59e0b'),
('Core Teachings', 'core-teachings', 'Core medical education sessions', '#3b82f6'),
('Twilight Teaching', 'twilight-teaching', 'Evening teaching sessions', '#8b5cf6'),
('OSCE Revision', 'osce-revision', 'OSCE preparation and revision sessions', '#ef4444'),

-- Clinical Skills & Practice
('Clinical Skills', 'clinical-skills', 'Hands-on clinical skills training', '#10b981'),
('Bedside Teaching', 'bedside-teaching', 'Bedside clinical teaching', '#f59e0b'),

-- Specialty Practice Sessions
('A-E Practice Sessions', 'a-e-practice-sessions', 'Airway and Breathing practice sessions', '#ef4444'),
('Obs & Gynae Practice', 'obs-gynae-practice-sessions', 'Obstetrics and Gynaecology practice sessions', '#ec4899'),
('Paeds Practice', 'paeds-practice-sessions', 'Paediatrics practice sessions', '#14b8a6'),

-- Assessment & Exams
('Exams & Mocks', 'exams-mocks', 'Examination and mock assessment sessions', '#8b5cf6'),

-- Specialized Sessions
('Hub Days', 'hub-days', 'Hub day activities and sessions', '#06b6d4'),
('Inductions', 'inductions', 'Induction and orientation sessions', '#84cc16'),
('Pharmacy Teaching', 'pharmacy-teaching', 'Pharmacy education sessions', '#a855f7'),
('Portfolio Drop-ins', 'portfolio-drop-ins', 'Portfolio support and guidance sessions', '#3b82f6'),

-- Virtual/Technology Formats
('Virtual Reality Sessions', 'virtual-reality-sessions', 'VR-based medical training', '#06b6d4'),

-- Other
('Others', 'others', 'Other teaching formats', '#6b7280');

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
