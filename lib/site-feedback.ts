/**
 * Public site / graduate feedback — shared options and a parseable message format
 * stored in contact_messages for later research export.
 */

export const FEEDBACK_MESSAGE_VERSION = 'BLEEPY_FEEDBACK_V1'

export const FEEDBACK_PATHWAYS = [
  { value: 'aru_student', label: 'ARU medical student' },
  { value: 'ucl_student', label: 'UCL medical student' },
  { value: 'foundation_year', label: 'Foundation Year doctor' },
  { value: 'other', label: 'Educator or other' },
] as const

export const FEEDBACK_RECOMMEND = [
  { value: 'yes', label: 'Yes' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'No' },
] as const

export const FEEDBACK_USEFUL = [
  { value: 'teaching_events', label: 'Teaching events' },
  { value: 'fy_guides', label: 'Foundation Year guides' },
  { value: 'simulator', label: 'AI patient simulator' },
  { value: 'games', label: 'Games' },
  { value: 'certificates', label: 'Certificates & attendance' },
] as const

export type FeedbackPathway = (typeof FEEDBACK_PATHWAYS)[number]['value']
export type FeedbackRecommend = (typeof FEEDBACK_RECOMMEND)[number]['value']
export type FeedbackUseful = (typeof FEEDBACK_USEFUL)[number]['value']

export type SiteFeedbackPayload = {
  source: string
  pathway: FeedbackPathway | ''
  rating: number | null
  recommend: FeedbackRecommend | ''
  mostUseful: string[]
  quoteConsent: boolean
  message: string
}

const PATHWAY_VALUES = new Set(FEEDBACK_PATHWAYS.map((p) => p.value))
const RECOMMEND_VALUES = new Set(FEEDBACK_RECOMMEND.map((p) => p.value))
const USEFUL_VALUES = new Set(FEEDBACK_USEFUL.map((p) => p.value))

export function isFeedbackPathway(value: string): value is FeedbackPathway {
  return PATHWAY_VALUES.has(value as FeedbackPathway)
}

export function isFeedbackRecommend(value: string): value is FeedbackRecommend {
  return RECOMMEND_VALUES.has(value as FeedbackRecommend)
}

export function sanitiseMostUseful(values: unknown): FeedbackUseful[] {
  if (!Array.isArray(values)) return []
  const unique = new Set<FeedbackUseful>()
  for (const value of values) {
    if (typeof value === 'string' && USEFUL_VALUES.has(value as FeedbackUseful)) {
      unique.add(value as FeedbackUseful)
    }
  }
  return [...unique]
}

function labelFor(list: readonly { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label || value || '—'
}

/** Human-readable + tagged block for the admin inbox and later parsing. */
export function formatSiteFeedbackMessage(data: SiteFeedbackPayload): string {
  const usefulLabels = data.mostUseful
    .map((value) => labelFor(FEEDBACK_USEFUL, value))
    .filter(Boolean)

  return [
    `[${FEEDBACK_MESSAGE_VERSION}]`,
    `Source: ${data.source || 'website'}`,
    `Pathway: ${data.pathway ? labelFor(FEEDBACK_PATHWAYS, data.pathway) : '—'}`,
    `Rating: ${data.rating ? `${data.rating}/5` : '—'}`,
    `Would recommend: ${data.recommend ? labelFor(FEEDBACK_RECOMMEND, data.recommend) : '—'}`,
    `Most useful: ${usefulLabels.length ? usefulLabels.join(', ') : '—'}`,
    `Quote consent: ${data.quoteConsent ? 'yes' : 'no'}`,
    '',
    'Comments',
    data.message.trim(),
  ].join('\n')
}
