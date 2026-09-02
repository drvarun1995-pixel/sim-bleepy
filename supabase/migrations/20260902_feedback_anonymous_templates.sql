-- Anonymous default on reusable feedback templates, and allow anonymous responses
-- without a stored user or booking.

ALTER TABLE public.feedback_templates
ADD COLUMN IF NOT EXISTS anonymous_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.feedback_templates.anonymous_enabled IS
  'Default for event forms created from this template: submit without login and do not store who answered.';

UPDATE public.feedback_templates
SET anonymous_enabled = false
WHERE anonymous_enabled IS NULL;

ALTER TABLE public.feedback_responses
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.feedback_responses
ALTER COLUMN booking_id DROP NOT NULL;
