-- Add login tracking fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Update existing users to have a default last_login
UPDATE public.users 
SET last_login = created_at 
WHERE last_login IS NULL;

-- Create index for faster queries on login activity
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_login_count ON public.users(login_count);

-- Grant permissions (if needed)
GRANT SELECT, UPDATE ON public.users TO authenticated;
