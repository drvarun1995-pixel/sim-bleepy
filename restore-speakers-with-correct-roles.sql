-- Restore speakers with CORRECT roles based on your actual data
-- CTF speakers and Foundation Year Doctor speakers

-- Clear existing speakers first
DELETE FROM speakers;

-- Insert speakers with CORRECT roles
INSERT INTO speakers (name, role) VALUES
-- CTF (Clinical Teaching Fellows) - from your list
('Maisoon', 'CTF'),
('Hannah-Maria', 'CTF'),
('Thanuji', 'CTF'),
('Varun', 'CTF'),
('Rudy', 'CTF'),
('Simran', 'CTF'),
('Megan', 'CTF'),
('Ghouse', 'CTF'),
('Vishnu', 'CTF'),
('Vania', 'CTF'),
('Faizan', 'CTF'),
('Kenan', 'CTF'),
('Tasfia', 'CTF'),
('Rihannah', 'CTF'),

-- Foundation Year Doctors - the rest
('Abdallah Abbas', 'Foundation Year Doctor'),
('Adnan', 'Foundation Year Doctor'),
('Amardeep', 'Foundation Year Doctor'),
('Anika Khair', 'Foundation Year Doctor'),
('Fatema', 'Foundation Year Doctor'),
('Gui', 'Foundation Year Doctor'),
('Iffat Mir', 'Foundation Year Doctor'),
('Keval', 'Foundation Year Doctor'),
('Kirish', 'Foundation Year Doctor'),
('Maizie Glover', 'Foundation Year Doctor'),
('Mahnoor', 'Foundation Year Doctor'),
('Maram', 'Foundation Year Doctor'),
('Raian', 'Foundation Year Doctor'),
('Samia Miah', 'Foundation Year Doctor'),
('Sarah', 'Foundation Year Doctor'),
('Shenelle', 'Foundation Year Doctor'),
('Yasmin Shameem', 'Foundation Year Doctor'),
('Zaina Alam', 'Foundation Year Doctor');

-- Create speakers view for API compatibility
DROP VIEW IF EXISTS speakers_with_counts;
CREATE VIEW speakers_with_counts AS
SELECT 
    s.id,
    s.name,
    s.role,
    s.created_at,
    s.updated_at,
    0 as event_count  -- For now, set to 0 since we don't have event_speakers junction table yet
FROM speakers s
ORDER BY s.name;


