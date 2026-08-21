-- Track confirmation reminder emails (12h, 3d, 7d, 30d). Service role only.
-- Run this in the Supabase SQL editor before the cron job can send reminders.

CREATE TABLE IF NOT EXISTS public.email_verification_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  step text NOT NULL CHECK (step IN ('12h', '3d', '7d', '30d')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, step)
);

CREATE INDEX IF NOT EXISTS email_verification_reminders_user_id_idx
  ON public.email_verification_reminders (user_id);

CREATE INDEX IF NOT EXISTS email_verification_reminders_step_idx
  ON public.email_verification_reminders (step);

COMMENT ON TABLE public.email_verification_reminders IS
  'Log of automatic confirm-email reminders. One row per user per step (12h, 3d, 7d, 30d).';
COMMENT ON COLUMN public.email_verification_reminders.step IS
  'Reminder step already sent: 12h, 3d, 7d, or 30d.';

ALTER TABLE public.email_verification_reminders ENABLE ROW LEVEL SECURITY;
