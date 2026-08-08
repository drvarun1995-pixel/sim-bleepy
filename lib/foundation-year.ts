export const FY_COHORTS = ['general', 'fy1', 'fy2'] as const

export type FyCohort = (typeof FY_COHORTS)[number]

export const FY_COHORT_META: Record<
  FyCohort,
  { label: string; shortLabel: string; description: string }
> = {
  general: {
    label: 'General',
    shortLabel: 'General',
    description: 'Resources useful across foundation training',
  },
  fy1: {
    label: 'FY1',
    shortLabel: 'FY1',
    description: 'Guidance tailored for first-year foundation doctors',
  },
  fy2: {
    label: 'FY2',
    shortLabel: 'FY2',
    description: 'Guidance tailored for second-year foundation doctors',
  },
}

export function isFyCohort(value: string): value is FyCohort {
  return (FY_COHORTS as readonly string[]).includes(value)
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
