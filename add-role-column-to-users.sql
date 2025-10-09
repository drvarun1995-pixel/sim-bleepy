-- Add role column to users table for role-based access control
-- This script adds a role column to support admin, educator, and student roles

-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';

-- Add constraint to ensure role is one of the valid values
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users 
ADD CONSTRAINT check_user_role 
CHECK (role IN ('admin', 'educator', 'student'));

-- Create index for better performance on role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'student' role (if they don't have one)
UPDATE users 
SET role = 'student'
WHERE role IS NULL;

-- Add comment to document the role field
COMMENT ON COLUMN users.role IS 'User role: admin, educator, or student';

-- Verify the change
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role';
