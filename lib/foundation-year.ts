export const FY_COHORTS = ['general', 'basildon', 'fy1', 'fy2'] as const

export type FyCohort = (typeof FY_COHORTS)[number]

/**
 * Basildon-Only is a first-class hub section. Until the DB CHECK constraint
 * allows cohort='basildon', its topics/pages are stored under FY1 and filtered
 * in/out of the FY1 listing by topic slug.
 */
export const FY_BASILDON_TOPIC_SLUGS = ['trust-induction', 'local-systems'] as const

export const FY_COHORT_META: Record<
  FyCohort,
  { label: string; shortLabel: string; description: string }
> = {
  general: {
    label: 'General',
    shortLabel: 'General',
    description: 'Everyday NHS life — jobs, money, tools and working with the team',
  },
  basildon: {
    label: 'Basildon-Only',
    shortLabel: 'Basildon',
    description: 'Members-only trust-specific induction and local Basildon guidance',
  },
  fy1: {
    label: 'FY1',
    shortLabel: 'FY1',
    description: 'Ward, prescribing and on-call skills for first-year foundation doctors',
  },
  fy2: {
    label: 'FY2',
    shortLabel: 'FY2',
    description: 'Exams, CPD, audit and next steps for second-year foundation doctors',
  },
}

/** Cohorts whose published, non-members-only pages may appear on /guides */
export const PUBLIC_FY_COHORTS: readonly FyCohort[] = ['general', 'fy1', 'fy2']

export function isFyCohort(value: string): value is FyCohort {
  return (FY_COHORTS as readonly string[]).includes(value)
}

export function isPublicFyCohort(value: string): boolean {
  return (PUBLIC_FY_COHORTS as readonly string[]).includes(value)
}

export function isBasildonTopicSlug(slug: string): boolean {
  return (FY_BASILDON_TOPIC_SLUGS as readonly string[]).includes(slug)
}

/** Cohort value stored on fy_topics rows (basildon content lives under fy1 until DB allows 'basildon'). */
export function fyStorageCohort(cohort: FyCohort): 'general' | 'fy1' | 'fy2' {
  if (cohort === 'basildon') return 'fy1'
  return cohort
}

/** Presentational cohort for a stored topic row. */
export function fyPresentationalCohort(
  storageCohort: string,
  topicSlug: string
): FyCohort {
  if (storageCohort === 'fy1' && isBasildonTopicSlug(topicSlug)) return 'basildon'
  if (isFyCohort(storageCohort)) return storageCohort
  return 'general'
}

export function slugify(input: string, fallback = 'item'): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || fallback
}

/** Storage prefix reused by placements image APIs via specialtySlug */
export function fyImageScope(cohort: FyCohort, topicSlug: string): string {
  return `foundation-year/${fyStorageCohort(cohort)}/${topicSlug}`
}

export function canManageFoundationYear(role?: string | null): boolean {
  return role === 'admin' || role === 'meded_team' || role === 'ctf'
}
