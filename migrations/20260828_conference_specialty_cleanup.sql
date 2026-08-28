-- Conference specialty cleanup:
-- 1. Add Radiology (idempotent)
-- 2. Keep Cardiology; retire Cardiovascular
-- 3. Retire AMU (Acute Medical Unit); keep Acute Medicine
-- 4. Rename ITU to Intensive Care
-- 5. Put active specialties in A–Z display_order for the conference filter
--
-- Run this in the Supabase SQL editor.

INSERT INTO public.specialties (name, slug, description, display_order, is_active)
VALUES (
  'Radiology',
  'radiology',
  'Radiology, imaging and interventional radiology presentation opportunities',
  90,
  true
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true,
  updated_at = NOW();

INSERT INTO public.conference_sources (name, base_url, adapter_key, enabled)
VALUES
  ('British Institute of Radiology', 'https://www.bir.org.uk/education-and-events/call-for-abstracts/', 'bir_abstracts', true),
  ('British Society of Interventional Radiology', 'https://www.bsirmeeting.org/submit/abstract-submission/', 'bsir_abstracts', true)
ON CONFLICT (adapter_key) DO UPDATE
SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  updated_at = NOW();

-- Move Cardiovascular conference tags onto Cardiology, then hide Cardiovascular.
INSERT INTO public.conference_opportunity_specialties (opportunity_id, specialty_id)
SELECT cos.opportunity_id, cardiology.id
FROM public.conference_opportunity_specialties cos
JOIN public.specialties old
  ON old.id = cos.specialty_id
 AND (
   old.slug IN ('cardiovascular')
   OR lower(old.name) = 'cardiovascular'
 )
JOIN public.specialties cardiology
  ON cardiology.slug = 'cardiology'
ON CONFLICT (opportunity_id, specialty_id) DO NOTHING;

DELETE FROM public.conference_opportunity_specialties
WHERE specialty_id IN (
  SELECT id FROM public.specialties
  WHERE slug IN ('cardiovascular')
     OR lower(name) = 'cardiovascular'
);

UPDATE public.specialties
SET is_active = false, updated_at = NOW()
WHERE slug IN ('cardiovascular')
   OR lower(name) = 'cardiovascular';

-- Move AMU conference tags onto Acute Medicine, then hide AMU.
INSERT INTO public.conference_opportunity_specialties (opportunity_id, specialty_id)
SELECT cos.opportunity_id, acute_medicine.id
FROM public.conference_opportunity_specialties cos
JOIN public.specialties old
  ON old.id = cos.specialty_id
 AND (
   old.slug IN ('amu', 'amu-acute-medical-unit', 'acute-medical-unit')
   OR old.name ILIKE 'AMU%'
 )
JOIN public.specialties acute_medicine
  ON acute_medicine.slug = 'acute-medicine'
ON CONFLICT (opportunity_id, specialty_id) DO NOTHING;

DELETE FROM public.conference_opportunity_specialties
WHERE specialty_id IN (
  SELECT id FROM public.specialties
  WHERE slug IN ('amu', 'amu-acute-medical-unit', 'acute-medical-unit')
     OR name ILIKE 'AMU%'
);

UPDATE public.specialties
SET is_active = false, updated_at = NOW()
WHERE slug IN ('amu', 'amu-acute-medical-unit', 'acute-medical-unit')
   OR name ILIKE 'AMU%';

-- Rename ITU to Intensive Care (keep the same row and any existing links).
UPDATE public.specialties
SET
  name = 'Intensive Care',
  slug = CASE
    WHEN slug IN ('itu', 'icu') THEN 'intensive-care'
    ELSE slug
  END,
  description = COALESCE(NULLIF(description, ''), 'Intensive care and critical care'),
  updated_at = NOW()
WHERE slug IN ('itu', 'icu')
   OR lower(name) = 'itu'
   OR name ILIKE 'ITU%';

-- A–Z order for the live specialty dropdown (API sorts by display_order).
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY name ASC) AS n
  FROM public.specialties
  WHERE is_active = true
)
UPDATE public.specialties s
SET display_order = ranked.n, updated_at = NOW()
FROM ranked
WHERE s.id = ranked.id;
