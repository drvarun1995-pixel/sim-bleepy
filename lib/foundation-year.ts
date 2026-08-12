export const FY_COHORTS = ['general', 'basildon'] as const

/** Legacy cohorts retained for URL redirects / old links */
export const LEGACY_FY_COHORTS = ['fy1', 'fy2'] as const

export type FyCohort = (typeof FY_COHORTS)[number]
export type LegacyFyCohort = (typeof LEGACY_FY_COHORTS)[number]
export type AnyFyCohort = FyCohort | LegacyFyCohort

export const FY_COHORT_META: Record<
  FyCohort,
  { label: string; shortLabel: string; description: string }
> = {
  general: {
    label: 'General',
    shortLabel: 'General',
    description: 'Practical NHS guides for foundation doctors — on-calls, prescribing, investigations and day-to-day life',
  },
  basildon: {
    label: 'Basildon-Only',
    shortLabel: 'Basildon',
    description: 'Members-only trust-specific induction and local Basildon guidance',
  },
}

/** Cohorts whose published, non-members-only pages may appear on /guides */
export const PUBLIC_FY_COHORTS: readonly FyCohort[] = ['general']

export function isFyCohort(value: string): value is FyCohort {
  return (FY_COHORTS as readonly string[]).includes(value)
}

export function isLegacyFyCohort(value: string): value is LegacyFyCohort {
  return (LEGACY_FY_COHORTS as readonly string[]).includes(value)
}

export function isAnyFyCohort(value: string): value is AnyFyCohort {
  return isFyCohort(value) || isLegacyFyCohort(value)
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
export function fyImageScope(cohort: FyCohort | string, topicSlug: string): string {
  return `foundation-year/${cohort}/${topicSlug}`
}

export function canManageFoundationYear(role?: string | null): boolean {
  return role === 'admin' || role === 'meded_team' || role === 'ctf'
}
