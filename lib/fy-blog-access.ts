import { FY_COHORTS, LEGACY_FY_COHORTS } from '@/lib/foundation-year'

/** Slugs that must never be public / crawlable, even before DB flag syncs. */
export const FY_MEMBERS_ONLY_SLUGS = new Set([
  'trust-induction-basildon-hospital',
  'fy1-iv-fluid-prescribing',
  'dnar-dnacpr-guide',
  'post-falls-assessment',
])

const PLACEMENT_COHORT_ALT = [...FY_COHORTS, ...LEGACY_FY_COHORTS].join('|')

export function isMembersOnlyFyPage(page: {
  slug?: string | null
  requires_auth?: boolean | null
}): boolean {
  if (page.requires_auth === true) return true
  if (page.slug && FY_MEMBERS_ONLY_SLUGS.has(page.slug)) return true
  return false
}

/** Public guides are indexable; members-only pages are not. */
export function isPublicFyPage(page: {
  slug?: string | null
  requires_auth?: boolean | null
  status?: string | null
  is_active?: boolean | null
}): boolean {
  if (page.is_active === false) return false
  if (page.status && page.status !== 'published') return false
  return !isMembersOnlyFyPage(page)
}

/**
 * Resolve requires_auth for create/update.
 * Default is members-only; members-only slugs are always forced true.
 * Only an explicit `false` makes a page public.
 */
export function resolveRequiresAuth(opts: {
  slug?: string | null
  requires_auth?: boolean | null
}): boolean {
  if (opts.slug && FY_MEMBERS_ONLY_SLUGS.has(opts.slug)) return true
  if (opts.requires_auth === false) return false
  return true
}

export function publicGuidePath(topicSlug: string, pageSlug: string) {
  return `/guides/foundation-year/${topicSlug}/${pageSlug}`
}

export function publicGuideTopicPath(topicSlug: string) {
  return `/guides/foundation-year/${topicSlug}`
}

export function placementGuidePath(
  cohort: string,
  topicSlug: string,
  pageSlug: string
) {
  return `/placements/foundation-year/${cohort}/${topicSlug}/${pageSlug}`
}

export type FyArticleLocation = {
  cohort: string
  topicSlug: string
  pageSlug: string
}

/**
 * Parse an FY article href into topic + page slug (guides or placements forms).
 */
export function parseFyArticleHref(
  href: string
): { topicSlug: string; pageSlug: string; cohort?: string } | null {
  const raw = (href || '').trim()
  if (!raw) return null

  let path = raw
  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw)
      if (!/(?:^|\.)bleepy\.co\.uk$/i.test(url.hostname) && url.hostname !== 'localhost') {
        return null
      }
      path = url.pathname
    }
  } catch {
    return null
  }

  const guide = path.match(
    /^\/guides\/foundation-year\/([^/]+)\/([^/]+)\/?$/i
  )
  if (guide) return { topicSlug: guide[1], pageSlug: guide[2] }

  const placement = path.match(
    new RegExp(
      `^/placements/foundation-year/(${PLACEMENT_COHORT_ALT})/([^/]+)/([^/]+)/?$`,
      'i'
    )
  )
  if (placement) {
    return {
      cohort: placement[1],
      topicSlug: placement[2],
      pageSlug: placement[3],
    }
  }

  return null
}

/**
 * Logged-in surface: map guide/placement article links onto placements URLs.
 * Prefer the page's real cohort/topic from `locationBySlug` so unique posts
 * are not forced into the viewer's current cohort.
 */
export function toPlacementArticleHref(
  href: string,
  cohort: string,
  locationBySlug?: Map<string, FyArticleLocation> | Record<string, FyArticleLocation>
): string | null {
  const parsed = parseFyArticleHref(href)
  if (!parsed) return null

  const loc =
    locationBySlug instanceof Map
      ? locationBySlug.get(parsed.pageSlug)
      : locationBySlug?.[parsed.pageSlug]

  if (loc) {
    return placementGuidePath(loc.cohort, loc.topicSlug, parsed.pageSlug)
  }

  return placementGuidePath(cohort, parsed.topicSlug, parsed.pageSlug)
}

/** Public surface: map placement article links onto /guides. */
export function toPublicGuideArticleHref(href: string): string | null {
  const parsed = parseFyArticleHref(href)
  if (!parsed) return null
  return publicGuidePath(parsed.topicSlug, parsed.pageSlug)
}
