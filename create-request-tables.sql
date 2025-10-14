-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own file requests" ON file_requests;
DROP POLICY IF EXISTS "Users can view their own file requests" ON file_requests;
DROP POLICY IF EXISTS "Admins can view all file requests" ON file_requests;
DROP POLICY IF EXISTS "Admins can update all file requests" ON file_requests;

DROP POLICY IF EXISTS "Users can insert their own teaching requests" ON teaching_requests;
DROP POLICY IF EXISTS "Users can view their own teaching requests" ON teaching_requests;
DROP POLICY IF EXISTS "Admins can view all teaching requests" ON teaching_requests;
DROP POLICY IF EXISTS "Admins can update all teaching requests" ON teaching_requests;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_file_requests_updated_at ON file_requests;
DROP TRIGGER IF EXISTS update_teaching_requests_updated_at ON teaching_requests;

-- Create file_requests table
CREATE TABLE IF NOT EXISTS file_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT,
  file_name TEXT NOT NULL,
  description TEXT NOT NULL,
  additional_info TEXT,
  event_id UUID REFERENCES events(id),
  event_title TEXT NOT NULL,
  event_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teaching_requests table
CREATE TABLE IF NOT EXISTS teaching_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT,
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TIME,
  duration TEXT NOT NULL,
  categories TEXT[] NOT NULL,
  format TEXT NOT NULL,
  additional_info TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_requests_user_email ON file_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_file_requests_status ON file_requests(status);
CREATE INDEX IF NOT EXISTS idx_file_requests_created_at ON file_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_teaching_requests_user_email ON teaching_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_status ON teaching_requests(status);
CREATE INDEX IF NOT EXISTS idx_teaching_requests_created_at ON teaching_requests(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE file_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_requests
-- Users can insert their own requests
CREATE POLICY "Users can insert their own file requests" ON file_requests
  FOR INSERT WITH CHECK (auth.email() = user_email);

-- Only Admins, CTF, Educators, and MedEd Team can view all requests
CREATE POLICY "Admins can view all file requests" ON file_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.email() 
      AND users.role IN ('admin', 'ctf', 'educator', 'meded_team')
    )
  );

-- Only Admins, CTF, Educators, and MedEd Team can update all requests
CREATE POLICY "Admins can update all file requests" ON file_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.email() 
      AND users.role IN ('admin', 'ctf', 'educator', 'meded_team')
    )
  );

-- RLS Policies for teaching_requests
-- Users can insert their own requests
CREATE POLICY "Users can insert their own teaching requests" ON teaching_requests
  FOR INSERT WITH CHECK (auth.email() = user_email);

-- Only Admins, CTF, Educators, and MedEd Team can view all requests
CREATE POLICY "Admins can view all teaching requests" ON teaching_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.email() 
      AND users.role IN ('admin', 'ctf', 'educator', 'meded_team')
    )
  );

-- Only Admins, CTF, Educators, and MedEd Team can update all requests
CREATE POLICY "Admins can update all teaching requests" ON teaching_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.email() 
      AND users.role IN ('admin', 'ctf', 'educator', 'meded_team')
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to automatically update updated_at
CREATE TRIGGER update_file_requests_updated_at 
  BEFORE UPDATE ON file_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teaching_requests_updated_at 
  BEFORE UPDATE ON teaching_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
