-- Extra ingest sources, specialties, and seed URLs for conference adapters.

INSERT INTO public.conference_sources (name, base_url, adapter_key, enabled)
VALUES
  ('Royal College of Emergency Medicine', 'https://rcem.ac.uk/flagship/abstract-submissions/', 'rcem_abstracts', true),
  ('Royal College of Paediatrics and Child Health', 'https://www.rcpch.ac.uk/news-events/rcpch-conference/abstract-FAQs-2026', 'rcpch_conference', true),
  ('British Thoracic Society', 'https://www.brit-thoracic.org.uk/education-and-events/upcoming-meeting-dates/', 'bts_meetings', true),
  ('British Society for Rheumatology', 'https://www.rheumatology.org.uk/events-learning/conferences/annualconference', 'bsr_annual_conference', true),
  ('British Cardiovascular Society', 'https://britishcardiovascularsociety.org.uk/annual-conference/', 'bcs_annual_conference', true),
  ('Society for Acute Medicine', 'https://www.acutemedicine.org.uk/wp-content/uploads/SAMManchester-2025_Call-for-Abstracts.pdf', 'sam_cfp', true),
  ('Royal College of Psychiatrists', 'https://www.rcpsych.ac.uk/events/congress', 'rcpsych_congress', true)
ON CONFLICT (adapter_key) DO UPDATE
SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  updated_at = NOW();

INSERT INTO public.specialties (name, slug, description, display_order, is_active)
VALUES
  ('Emergency Medicine', 'emergency-medicine', 'Emergency medicine presentation opportunities', 83, true),
  ('Paediatrics', 'paediatrics', 'Paediatrics and child health', 84, true),
  ('Respiratory Medicine', 'respiratory', 'Respiratory and thoracic medicine', 85, true),
  ('Rheumatology', 'rheumatology', 'Rheumatology and musculoskeletal medicine', 86, true),
  ('Cardiology', 'cardiology', 'Cardiology and cardiovascular medicine', 87, true),
  ('Acute Medicine', 'acute-medicine', 'Acute and general internal medicine', 88, true),
  ('Psychiatry', 'psychiatry', 'Psychiatry and mental health', 89, true)
ON CONFLICT (slug) DO NOTHING;
