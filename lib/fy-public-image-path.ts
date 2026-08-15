import { FY_MEMBERS_ONLY_SLUGS } from '@/lib/fy-blog-access'
import { LEGACY_FY_COHORTS, PUBLIC_FY_COHORTS } from '@/lib/foundation-year'

const PUBLIC_FY_IMAGE_COHORTS = new Set<string>([...PUBLIC_FY_COHORTS, ...LEGACY_FY_COHORTS])

/**
 * Parse a placements storage path used by public FY guides.
 * HTML still contains legacy `fy1` / `fy2` copies of the same public assets.
 */
export function parsePublicFyImagePath(
  filePath: string
): { cohort: string; pageSlug: string } | null {
  if (!filePath || filePath.includes('..') || !filePath.startsWith('foundation-year/')) {
    return null
  }
  const parts = filePath.split('/').filter(Boolean)
  // foundation-year / cohort / topicSlug / pageSlug / images / file
  if (parts.length < 5) return null
  const cohort = parts[1]
  const pageSlug = parts[3]
  if (!pageSlug || FY_MEMBERS_ONLY_SLUGS.has(pageSlug)) return null
  if (cohort === 'basildon' || !PUBLIC_FY_IMAGE_COHORTS.has(cohort)) return null
  return { cohort, pageSlug }
}
