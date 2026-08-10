export const FY_COHORTS = ['general', 'basildon', 'fy1', 'fy2'] as const

export type FyCohort = (typeof FY_COHORTS)[number]

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
  return `foundation-year/${cohort}/${topicSlug}`
}

export function canManageFoundationYear(role?: string | null): boolean {
  return role === 'admin' || role === 'meded_team' || role === 'ctf'
}
