-- Create contact_messages table for storing contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    admin_notes TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_category ON contact_messages(category);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_messages_updated_at
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only admins can read contact messages
CREATE POLICY "Admins can view all contact messages" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Only admins can update contact messages (for status changes, notes, etc.)
CREATE POLICY "Admins can update contact messages" ON contact_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- No one can delete contact messages (for audit purposes)
-- CREATE POLICY "No one can delete contact messages" ON contact_messages
--     FOR DELETE USING (false);

-- Insert some sample data for testing (optional)
-- INSERT INTO contact_messages (name, email, subject, category, message, status) VALUES
-- (
--     'John Doe',
--     'john.doe@example.com',
--     'Question about pricing',
--     'general',
--     'Hi, I would like to know more about your pricing plans for medical schools. Could you please send me more information?',
--     'new'
-- ),
-- (
--     'Jane Smith',
--     'jane.smith@university.edu',
--     'Technical issue with login',
--     'support',
--     'I am having trouble logging into my account. I keep getting an error message saying "Invalid credentials" even though I am sure my password is correct.',
--     'new'
-- ),
-- (
--     'Dr. Michael Johnson',
--     'm.johnson@hospital.org',
--     'Partnership opportunity',
--     'partnership',
--     'We are interested in exploring a partnership with Bleepy for our residency program. We would like to schedule a call to discuss potential collaboration.',
--     'new'
-- );

-- Verify the table was created successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contact_messages'
ORDER BY ordinal_position;
