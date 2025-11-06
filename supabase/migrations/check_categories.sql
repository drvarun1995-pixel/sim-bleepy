-- Check if categories exist in the database
-- Run this to see what categories are available

SELECT 
    id,
    name,
    slug,
    parent,
    color,
    created_at
FROM categories
ORDER BY name;

-- If no categories exist, you can create some sample categories
-- Uncomment and run the INSERT statements below if needed:

/*
INSERT INTO categories (name, slug, parent, description, color) VALUES
('ARU', 'aru', NULL, 'Anglia Ruskin University', '#3B82F6'),
('UCL', 'ucl', NULL, 'University College London', '#8B5CF6'),
('Foundation Year Doctor', 'foundation-year-doctor', NULL, 'Foundation Year Doctor', '#F59E0B'),
('ARU Year 1', 'aru-year-1', 'ARU', 'ARU Year 1', '#3B82F6'),
('ARU Year 2', 'aru-year-2', 'ARU', 'ARU Year 2', '#3B82F6'),
('ARU Year 3', 'aru-year-3', 'ARU', 'ARU Year 3', '#3B82F6'),
('ARU Year 4', 'aru-year-4', 'ARU', 'ARU Year 4', '#3B82F6'),
('ARU Year 5', 'aru-year-5', 'ARU', 'ARU Year 5', '#3B82F6'),
('UCL Year 5', 'ucl-year-5', 'UCL', 'UCL Year 5', '#8B5CF6'),
('UCL Year 6', 'ucl-year-6', 'UCL', 'UCL Year 6', '#8B5CF6'),
('Foundation Year 1', 'foundation-year-1', 'Foundation Year Doctor', 'Foundation Year 1', '#F59E0B'),
('Foundation Year 2', 'foundation-year-2', 'Foundation Year Doctor', 'Foundation Year 2', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;
*/

