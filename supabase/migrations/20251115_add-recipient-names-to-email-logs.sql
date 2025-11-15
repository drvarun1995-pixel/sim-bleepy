ALTER TABLE public.admin_email_logs
ADD COLUMN IF NOT EXISTS recipient_names text[],
ADD COLUMN IF NOT EXISTS recipient_name_search text;

UPDATE public.admin_email_logs
SET recipient_name_search = array_to_string(recipient_emails, ', ')
WHERE recipient_name_search IS NULL;

