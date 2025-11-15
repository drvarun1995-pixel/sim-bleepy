-- Create admin_email_logs table to track custom outbound emails
CREATE TABLE IF NOT EXISTS public.admin_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id UUID REFERENCES public.users(id),
  sender_email TEXT,
  sender_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  recipient_scope TEXT NOT NULL CHECK (recipient_scope IN ('all', 'role', 'individual')),
  recipient_roles TEXT[],
  recipient_ids UUID[],
  recipient_emails TEXT[],
  total_recipients INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_admin_email_logs_created_at ON public.admin_email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_email_logs_sender ON public.admin_email_logs(sender_user_id);

COMMENT ON TABLE public.admin_email_logs IS 'Stores a log of custom admin emails sent through the dashboard';
COMMENT ON COLUMN public.admin_email_logs.recipient_scope IS 'Describes whether the email went to all users, a role-based segment, or individually selected users';
COMMENT ON COLUMN public.admin_email_logs.recipient_roles IS 'Array of roles targeted when recipient_scope = role';
COMMENT ON COLUMN public.admin_email_logs.recipient_ids IS 'Array of specific user IDs targeted when recipient_scope = individual';
COMMENT ON COLUMN public.admin_email_logs.recipient_emails IS 'Snapshot of recipient email addresses for auditing';

ALTER TABLE public.admin_email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin email logs" ON public.admin_email_logs;
CREATE POLICY "Admins can view admin email logs"
  ON public.admin_email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'meded_team')
    )
  );

-- Create storage bucket for admin email assets (inline images, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-files', 'email-files', FALSE)
ON CONFLICT (id) DO NOTHING;

