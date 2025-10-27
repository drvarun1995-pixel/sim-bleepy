-- Remove category restriction from the test event
UPDATE events 
SET allowed_roles = NULL 
WHERE id = 'df9ab175-88e8-48db-8c77-ccd34d31dce2';

-- Verify the change
SELECT id, title, allowed_roles 
FROM events 
WHERE id = 'df9ab175-88e8-48db-8c77-ccd34d31dce2';



