/**
 * Shared Foundation Year guide search helpers.
 * Matches title, slug, meta description, topic name, and curated aliases.
 */

import { FY_META_DESCRIPTIONS } from '@/lib/fy-meta-descriptions'

export function sanitizeFySearchQuery(raw: string) {
  return raw.trim().slice(0, 80).replace(/[%_,]/g, ' ')
}

/**
 * Primary / secondary search aliases by page slug.
 * Keep entries short clinical synonyms — not full SEO dumps.
 */
export const FY_SEARCH_KEYWORDS: Record<string, string[]> = {
  'fy1-potassium-prescribing-hypokalaemia': [
    'hypokalaemia',
    'hypokalemia',
    'hyperkalaemia',
    'hyperkalemia',
    'low potassium',
    'high potassium',
    'k+',
    'potassium replacement',
    'potassium infusion',
  ],
  'hyponatraemia-foundation-doctors': [
    'hyponatremia',
    'low sodium',
    'sodium',
    'siadh',
    'fluid restriction',
  ],
  'fy1-approach-to-hypotension': [
    'low blood pressure',
    'shock',
    'bp',
    'hypotensive',
    'sepsis',
  ],
  'fy1-new-oxygen-requirement': [
    'hypoxia',
    'desaturation',
    'spo2',
    'o2',
    'oxygen therapy',
  ],
  'breathlessness-assessment-fy-guide': [
    'dyspnoea',
    'dyspnea',
    'shortness of breath',
    'sob',
    'pe',
    'pulmonary embolism',
    'copd',
    'asthma',
  ],
  'foundation-doctor-chest-pain': [
    'acs',
    'mi',
    'angina',
    'troponin',
    'ecg',
    'dissection',
    'pe',
  ],
  'acute-seizure-management-fy-guide': [
    'fit',
    'fitting',
    'status epilepticus',
    'epilepsy',
    'lorazepam',
    'midazolam',
  ],
  'tachycardia-on-the-ward-fy-guide': [
    'fast heart rate',
    'svt',
    'af',
    'atrial fibrillation',
    'vt',
    'arrhythmia',
    'adenosine',
  ],
  'fy-reduced-gcs-approach': [
    'unconscious',
    'reduced consciousness',
    'coma',
    'acvpu',
    'altered mental status',
  ],
  'fy1-review-patient-on-call': [
    'bleep',
    'ward review',
    'unfamiliar patient',
    'sbar',
    'abcde',
  ],
  'fy1-anticoagulation-ward-basics': [
    'warfarin',
    'doac',
    'lmwh',
    'heparin',
    'inr',
    'vte',
    'blood thinner',
  ],
  'dnar-dnacpr-rules-for-doctors-fy-guide': [
    'dnar',
    'dnacpr',
    'resuscitation',
    'ceiling of care',
    'respect',
  ],
  'dnar-dnacpr-guide': [
    'dnar',
    'dnacpr',
    'resuscitation',
    'ceiling of care',
    'respect',
  ],
  'abg-made-easy': [
    'arterial blood gas',
    'acidosis',
    'alkalosis',
    'ph',
    'paco2',
    'hco3',
  ],
  'ecg-basics-guide': ['ekg', 'heart rhythm', 'st elevation', 'bradycardia'],
  'aki-stages-quick-guide': [
    'acute kidney injury',
    'creatinine',
    'renal',
    'kidney',
  ],
  'dka-management-foundation-year': [
    'diabetic',
    'diabetes',
    'diabetic ketoacidosis',
    'ketoacidosis',
    'ketones',
    'ketosis',
    'friii',
    'fixed-rate insulin',
    'euglycaemic dka',
    'sglt2',
  ],
  'post-falls-assessment': ['fall', 'falls', 'inpatient fall', 'head injury'],
  'mdt-dates-basildon-hospital': [
    'mdt',
    'multidisciplinary',
    'timetable',
    'addenbrooke',
  ],
  'fy1-iv-fluid-prescribing': [
    'fluids',
    'iv fluids',
    'maintenance',
    'resuscitation fluids',
    '5 rs',
  ],
  'vte-prophylaxis-guide': [
    'dvt',
    'pe',
    'thromboprophylaxis',
    'enoxaparin',
    'blood clot',
  ],
  'confusion-screen-bloods': [
    'delirium',
    'confused',
    'ams',
    'confusion screen',
  ],
}

export type FySearchPageRow = {
  id: string
  title: string
  slug: string
  featured_image?: string | null
  updated_at?: string | null
  topic_id: string
  meta_description?: string | null
  requires_auth?: boolean | null
  status?: string | null
  is_active?: boolean | null
}

export type FySearchTopicRow = {
  id: string
  cohort: string
  name: string
  slug: string
  description?: string | null
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function includesNormalized(haystack: string, needle: string) {
  if (!haystack || !needle) return false
  return normalize(haystack).includes(normalize(needle))
}

/** Score a page against a search query. Higher is better; 0 = no match. */
export function scoreFyPageMatch(
  page: Pick<FySearchPageRow, 'title' | 'slug' | 'meta_description'>,
  topic: Pick<FySearchTopicRow, 'name' | 'slug'> | null | undefined,
  query: string
): number {
  const q = normalize(query)
  if (q.length < 2) return 0

  let score = 0
  const title = page.title || ''
  const slug = page.slug || ''
  const meta = page.meta_description || FY_META_DESCRIPTIONS[slug] || ''
  const topicName = topic?.name || ''
  const topicSlug = topic?.slug || ''
  const keywords = FY_SEARCH_KEYWORDS[slug] || []

  if (includesNormalized(title, q)) score += 100
  if (normalize(title) === q) score += 40

  if (keywords.some((k) => normalize(k) === q || includesNormalized(k, q) || includesNormalized(q, k))) {
    score += 90
  }

  if (includesNormalized(slug, q)) score += 70
  if (includesNormalized(meta, q)) score += 40
  if (includesNormalized(topicName, q)) score += 35
  if (includesNormalized(topicSlug, q)) score += 25

  // Multi-word: require all tokens somewhere across fields for a soft match
  const tokens = q.split(' ').filter((t) => t.length >= 2)
  if (tokens.length > 1) {
    const blob = normalize([title, slug, meta, topicName, topicSlug, ...keywords].join(' '))
    if (tokens.every((t) => blob.includes(t))) score += 20
  }

  return score
}

export function rankFyPages<T extends FySearchPageRow>(
  pages: T[],
  topicById: Map<string, FySearchTopicRow>,
  query: string,
  limit: number
): T[] {
  return pages
    .map((page) => ({
      page,
      score: scoreFyPageMatch(page, topicById.get(page.topic_id), query),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const ta = a.page.updated_at ? new Date(a.page.updated_at).getTime() : 0
      const tb = b.page.updated_at ? new Date(b.page.updated_at).getTime() : 0
      return tb - ta
    })
    .slice(0, limit)
    .map((row) => row.page)
}
