-- Add MedEd Team and CTF roles to the users table
-- These roles have educator permissions plus event management and contact messages access

-- Update role column constraint to include new roles
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check 
CHECK (role IN ('student', 'educator', 'admin', 'meded_team', 'ctf'));

-- Update existing users if needed (optional - for migration)
-- EXAMPLE: UPDATE users SET role = 'meded_team' WHERE email = 'example@meded.com';

-- Add comment to explain the new roles
COMMENT ON COLUMN users.role IS 'User role: student, educator, admin, meded_team (MedEd Team with event management), ctf (CTF with event management)';

-- Create index for role filtering if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Successfully added meded_team and ctf roles';
  RAISE NOTICE 'MedEd Team: Has all educator permissions + event management + contact messages';
  RAISE NOTICE 'CTF: Has all educator permissions + event management + contact messages';
END $$;

