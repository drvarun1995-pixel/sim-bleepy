-- Unique feedback-form QR codes (slide/email). Deleted with the form, not the template.

ALTER TABLE public.feedback_forms
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS qr_code_image_url TEXT,
ADD COLUMN IF NOT EXISTS qr_code_storage_path TEXT;

COMMENT ON COLUMN public.feedback_forms.qr_code_data IS
  'Public URL encoded in this form unique QR (guest or signed-in feedback page).';
COMMENT ON COLUMN public.feedback_forms.qr_code_image_url IS
  'Public storage URL for the form QR PNG.';
COMMENT ON COLUMN public.feedback_forms.qr_code_storage_path IS
  'Path inside the qr-codes bucket so the file can be removed when the form is deleted.';
