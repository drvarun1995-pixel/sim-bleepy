-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_audience JSONB NOT NULL, -- Store target audience configuration
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements
-- Everyone can read active announcements
CREATE POLICY "Anyone can read active announcements" ON announcements
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Only educators and admins can create announcements
CREATE POLICY "Educators and admins can create announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text::uuid 
      AND users.role IN ('educator', 'admin')
    )
  );

-- Only the author or admins can update announcements
CREATE POLICY "Author and admins can update announcements" ON announcements
  FOR UPDATE USING (
    author_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text::uuid 
      AND users.role = 'admin'
    )
  );

-- Only the author or admins can delete announcements
CREATE POLICY "Author and admins can delete announcements" ON announcements
  FOR DELETE USING (
    author_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text::uuid 
      AND users.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- Insert sample announcements for testing
INSERT INTO announcements (title, content, author_id, target_audience, priority, expires_at) VALUES 
(
  'Welcome to Bleepy!',
  'Welcome to our clinical training platform. Explore the AI patient simulator, attend live events, and track your progress.',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '{"type": "all", "roles": [], "years": [], "universities": []}',
  'normal',
  NOW() + INTERVAL '30 days'
),
(
  'New Clinical Stations Available',
  'We have added new clinical scenarios for medical students. Check out the updated stations in the AI Patient Simulator section.',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '{"type": "specific", "roles": ["medical_student"], "years": [], "universities": []}',
  'high',
  NOW() + INTERVAL '14 days'
)
ON CONFLICT DO NOTHING;

