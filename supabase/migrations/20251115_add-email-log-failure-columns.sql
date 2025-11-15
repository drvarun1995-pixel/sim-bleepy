ALTER TABLE public.admin_email_logs
  ADD COLUMN IF NOT EXISTS success_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_recipient_emails text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS failed_recipient_ids uuid[] DEFAULT ARRAY[]::uuid[],
  ADD COLUMN IF NOT EXISTS failure_messages jsonb DEFAULT '[]'::jsonb;

