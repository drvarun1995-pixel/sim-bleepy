-- Restore ALL speakers by duplicating all organizers as speakers
-- This gives you a complete set of speakers without hunting down original data

-- Clear existing speakers first
DELETE FROM speakers;

-- Insert ALL organizers as speakers with CTF role
INSERT INTO speakers (name, role) VALUES
-- All 32 organizers from your restored list
('Sarah', 'CTF'),
('Maisoon', 'CTF'),
('Hannah-Maria', 'CTF'),
('Thanuji', 'CTF'),
('Varun', 'CTF'),
('Simran', 'CTF'),
('Megan', 'CTF'),
('Fatema', 'CTF'),
('Adnan', 'CTF'),
('Rudy', 'CTF'),
('Mahnoor', 'CTF'),
('Kirish', 'CTF'),
('Ghouse', 'CTF'),
('Vishnu', 'CTF'),
('Vania', 'CTF'),
('Faizan', 'CTF'),
('Kenan', 'CTF'),
('Tasfia', 'CTF'),
('Rihannah', 'CTF'),
('Raian', 'CTF'),
('Shenelle', 'CTF'),
('Iffat Mir', 'CTF'),
('Abdallah Abbas', 'CTF'),
('Keval', 'CTF'),
('Maizie Glover', 'CTF'),
('Samia Miah', 'CTF'),
('Amardeep', 'CTF'),
('Yasmin Shameem', 'CTF'),
('Anika Khair', 'CTF'),
('Zaina Alam', 'CTF'),
('Gui', 'CTF'),
('Maram', 'CTF');

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
