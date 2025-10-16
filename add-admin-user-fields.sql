-- Add fields for admin-created users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS admin_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Update existing users to have these fields set to false
UPDATE public.users 
SET admin_created = FALSE, must_change_password = FALSE 
WHERE admin_created IS NULL OR must_change_password IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_must_change_password ON public.users(must_change_password);
CREATE INDEX IF NOT EXISTS idx_users_admin_created ON public.users(admin_created);

-- Grant permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;
