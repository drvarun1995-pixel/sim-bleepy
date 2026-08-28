-- Radiology conference ingest sources: BIR call-for-abstracts hub and BSIR annual abstract page.

INSERT INTO public.conference_sources (name, base_url, adapter_key, enabled)
VALUES
  ('British Institute of Radiology', 'https://www.bir.org.uk/education-and-events/call-for-abstracts/', 'bir_abstracts', true),
  ('British Society of Interventional Radiology', 'https://www.bsirmeeting.org/submit/abstract-submission/', 'bsir_abstracts', true)
ON CONFLICT (adapter_key) DO UPDATE
SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  updated_at = NOW();

INSERT INTO public.specialties (name, slug, description, display_order, is_active)
VALUES
  ('Radiology', 'radiology', 'Radiology, imaging and interventional radiology presentation opportunities', 90, true)
ON CONFLICT (slug) DO NOTHING;
