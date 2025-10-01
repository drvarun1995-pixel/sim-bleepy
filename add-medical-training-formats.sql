-- =====================================================
-- ADD MEDICAL TRAINING FORMATS
-- =====================================================
-- This script adds all the medical training formats from your screenshot
-- Note: slug is auto-generated from the name

INSERT INTO public.formats (name, slug, description, color) VALUES
    ('A-E Practice Sessions', 'a-e-practice-sessions', 'Assessment and Emergency practice sessions', '#FF6B6B'),
    ('Bedside Teaching', 'bedside-teaching', 'Clinical bedside teaching sessions', '#4ECDC4'),
    ('Clinical Skills', 'clinical-skills', 'Clinical skills training and practice', '#45B7D1'),
    ('Core Teachings', 'core-teachings', 'Core medical teaching sessions', '#96CEB4'),
    ('Exams & Mocks', 'exams-mocks', 'Examination and mock assessment sessions', '#FECA57'),
    ('Grand Round', 'grand-round', 'Grand round presentations and discussions', '#FF9FF3'),
    ('Hub days', 'hub-days', 'Hub day training sessions', '#54A0FF'),
    ('Inductions', 'inductions', 'Induction and orientation sessions', '#5F27CD'),
    ('Obs & Gynae Practice Sessions', 'obs-gynae-practice-sessions', 'Obstetrics and Gynaecology practice sessions', '#00D2D3'),
    ('OSCE Revision', 'osce-revision', 'OSCE examination revision sessions', '#FF9F43'),
    ('Others', 'others', 'Other training formats', '#778CA3'),
    ('Paeds Practice Sessions', 'paeds-practice-sessions', 'Paediatrics practice sessions', '#FF6348'),
    ('Pharmacy Teaching', 'pharmacy-teaching', 'Pharmacy and medication teaching', '#2ED573'),
    ('Portfolio Drop-ins', 'portfolio-drop-ins', 'Portfolio review and drop-in sessions', '#C44569'),
    ('Twilight Teaching', 'twilight-teaching', 'Evening twilight teaching sessions', '#F8B500'),
    ('Virtual Reality Sessions', 'virtual-reality-sessions', 'VR-based training sessions', '#6C5CE7');

-- =====================================================
-- VERIFY THE FORMATS WERE ADDED
-- =====================================================
SELECT 
    id,
    name,
    slug,
    description,
    color,
    created_at
FROM public.formats
ORDER BY name;

-- Count of formats
SELECT COUNT(*) as total_formats FROM public.formats;

