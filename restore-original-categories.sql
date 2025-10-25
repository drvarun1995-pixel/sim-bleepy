-- Restore the simple, correct categories you actually had
-- Clear existing categories first
DELETE FROM event_categories;
DELETE FROM categories;

-- Insert the actual categories you had with CORRECT COLORS from the codebase
-- Let the database generate UUIDs automatically
INSERT INTO categories (name, slug, parent, description, color) VALUES
-- Main categories with EXACT colors from lib/category-mapping.ts
('ARU', 'aru', 'none', 'Anglia Ruskin University', '#3B82F6'),
('UCL', 'ucl', 'none', 'University College London', '#8B5CF6'),
('Foundation Year Doctor', 'foundation-year-doctor', 'none', 'Foundation Year Doctor', '#F59E0B'),

-- ARU Year subcategories (all use ARU blue color)
('ARU Year 1', 'aru-year-1', 'ARU', 'ARU Year 1', '#3B82F6'),
('ARU Year 2', 'aru-year-2', 'ARU', 'ARU Year 2', '#3B82F6'),
('ARU Year 3', 'aru-year-3', 'ARU', 'ARU Year 3', '#3B82F6'),
('ARU Year 4', 'aru-year-4', 'ARU', 'ARU Year 4', '#3B82F6'),
('ARU Year 5', 'aru-year-5', 'ARU', 'ARU Year 5', '#3B82F6'),

-- UCL Year subcategories (all use UCL purple color)
('UCL Year 5', 'ucl-year-5', 'UCL', 'UCL Year 5', '#8B5CF6'),
('UCL Year 6', 'ucl-year-6', 'UCL', 'UCL Year 6', '#8B5CF6'),

-- Foundation Year subcategories (all use Foundation amber color)
('Foundation Year 1', 'foundation-year-1', 'Foundation Year Doctor', 'Foundation Year 1', '#F59E0B'),
('Foundation Year 2', 'foundation-year-2', 'Foundation Year Doctor', 'Foundation Year 2', '#F59E0B');

-- Update the categories_with_counts view to reflect the new structure
DROP VIEW IF EXISTS categories_with_counts;
CREATE VIEW categories_with_counts AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.parent,
    c.description,
    c.color,
    c.created_at,
    c.updated_at,
    COUNT(ec.event_id) as event_count
FROM categories c
LEFT JOIN event_categories ec ON c.id = ec.category_id
GROUP BY c.id, c.name, c.slug, c.parent, c.description, c.color, c.created_at, c.updated_at
ORDER BY c.name;
