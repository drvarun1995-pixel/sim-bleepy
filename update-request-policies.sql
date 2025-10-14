-- Update RLS policies to remove user access to their own requests

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own file requests" ON file_requests;
DROP POLICY IF EXISTS "Users can view their own teaching requests" ON teaching_requests;

-- The remaining policies should already exist, but if not, create them
CREATE POLICY IF NOT EXISTS "Users can insert their own file requests" ON file_requests
  FOR INSERT WITH CHECK (auth.email() = user_email);

CREATE POLICY IF NOT EXISTS "Admins can view all file requests" ON file_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.email() 
      AND users.role IN ('admin', 'ctf', 'educator', 'meded_team')
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update all file requests" ON file_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.email() 
      AND users.role IN ('admin', 'ctf', 'educator', 'meded_team')
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert their own teaching requests" ON teaching_requests
  FOR INSERT WITH CHECK (auth.email() = user_email);

CREATE POLICY IF NOT EXISTS "Admins can view all teaching requests" ON teaching_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.email() 
      AND users.role IN ('admin', 'ctf', 'educator', 'meded_team')
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update all teaching requests" ON teaching_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.email() 
      AND users.role IN ('admin', 'ctf', 'educator', 'meded_team')
    )
  );
