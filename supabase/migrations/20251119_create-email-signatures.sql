-- Create email_signatures table
-- Each user can have their own email signature

CREATE TABLE IF NOT EXISTS public.email_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_html TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one signature per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_signatures_user_id ON public.email_signatures(user_id);

-- Enable RLS
ALTER TABLE public.email_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own signature
CREATE POLICY "Users can view own signature"
  ON public.email_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = email_signatures.user_id
    )
  );

-- Users with email access can view their own signature
CREATE POLICY "Email users can view own signature"
  ON public.email_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = email_signatures.user_id
      AND users.role IN ('admin', 'meded_team')
    )
  );

-- Users can insert their own signature
CREATE POLICY "Users can insert own signature"
  ON public.email_signatures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = email_signatures.user_id
      AND users.role IN ('admin', 'meded_team')
    )
  );

-- Users can update their own signature
CREATE POLICY "Users can update own signature"
  ON public.email_signatures
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = email_signatures.user_id
      AND users.role IN ('admin', 'meded_team')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = email_signatures.user_id
      AND users.role IN ('admin', 'meded_team')
    )
  );

-- Users can delete their own signature
CREATE POLICY "Users can delete own signature"
  ON public.email_signatures
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = email_signatures.user_id
      AND users.role IN ('admin', 'meded_team')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_email_signatures_updated_at
  BEFORE UPDATE ON public.email_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_email_signatures_updated_at();

-- Add comments
COMMENT ON TABLE public.email_signatures IS 'Stores email signatures for users who can send emails';
COMMENT ON COLUMN public.email_signatures.content_html IS 'HTML content of the signature, can include images';

