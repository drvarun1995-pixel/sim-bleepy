-- Safe script to add role column to users table
-- This script checks if the role column exists before adding it

-- First, check if role column already exists
DO $$
BEGIN
    -- Check if role column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        -- Add role column if it doesn't exist
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) DEFAULT 'student';
        
        RAISE NOTICE 'Role column added successfully';
    ELSE
        RAISE NOTICE 'Role column already exists, skipping addition';
    END IF;
END $$;

-- Add constraint to ensure role is one of the valid values (only if it doesn't exist)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' AND constraint_name = 'check_user_role'
    ) THEN
        -- Add the constraint
        ALTER TABLE users 
        ADD CONSTRAINT check_user_role 
        CHECK (role IN ('admin', 'educator', 'student'));
        
        RAISE NOTICE 'Role constraint added successfully';
    ELSE
        RAISE NOTICE 'Role constraint already exists, skipping addition';
    END IF;
END $$;

-- Create index for better performance on role queries (only if it doesn't exist)
DO $$
BEGIN
    -- Check if index already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_role'
    ) THEN
        -- Create the index
        CREATE INDEX idx_users_role ON users(role);
        
        RAISE NOTICE 'Role index added successfully';
    ELSE
        RAISE NOTICE 'Role index already exists, skipping creation';
    END IF;
END $$;

-- Update existing users to have 'student' role (only if they don't have one)
UPDATE users 
SET role = 'student'
WHERE role IS NULL OR role = '';

-- Add comment to document the role field
COMMENT ON COLUMN users.role IS 'User role: admin, educator, or student';

-- Verify the final result
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

-- Show current role distribution
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;
