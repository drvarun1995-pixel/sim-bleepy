-- Restore ALL the actual organizers that existed in your application
-- Based on the complete list you provided - these are the REAL organizers from your actual data

-- Clear existing organizers first
DELETE FROM organizers;

-- Insert ALL 32 actual organizers that existed in your real application data
INSERT INTO organizers (name) VALUES
-- Core organizers from your actual data
('Sarah'),
('Maisoon'),
('Hannah-Maria'),
('Thanuji'),
('Varun'),
('Simran'),
('Megan'),
('Fatema'),
('Adnan'),
('Rudy'),
('Mahnoor'),
('Kirish'),
('Ghouse'),
('Vishnu'),
('Vania'),
('Faizan'),
('Kenan'),
('Tasfia'),
('Rihannah'),
('Raian'),
('Shenelle'),
('Iffat Mir'),
('Abdallah Abbas'),
('Keval'),
('Maizie Glover'),
('Samia Miah'),
('Amardeep'),
('Yasmin Shameem'),
('Anika Khair'),
('Zaina Alam'),
('Gui'),
('Maram');

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


