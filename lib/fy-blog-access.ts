/** Slugs that must never be public / crawlable, even before DB flag syncs. */
export const FY_MEMBERS_ONLY_SLUGS = new Set([
  'trust-induction-basildon-hospital',
  'fy1-iv-fluid-prescribing',
])

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

/**
 * Parse an FY article href into topic + page slug (guides or placements forms).
 */
export function parseFyArticleHref(
  href: string
): { topicSlug: string; pageSlug: string } | null {
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
    /^\/placements\/foundation-year\/(?:general|fy1|fy2)\/([^/]+)\/([^/]+)\/?$/i
  )
  if (placement) return { topicSlug: placement[1], pageSlug: placement[2] }

  return null
}

/** Logged-in surface: map public/guide or other-cohort links onto this cohort. */
export function toPlacementArticleHref(href: string, cohort: string): string | null {
  const parsed = parseFyArticleHref(href)
  if (!parsed) return null
  return placementGuidePath(cohort, parsed.topicSlug, parsed.pageSlug)
}

/** Public surface: map placement article links onto /guides. */
export function toPublicGuideArticleHref(href: string): string | null {
  const parsed = parseFyArticleHref(href)
  if (!parsed) return null
  return publicGuidePath(parsed.topicSlug, parsed.pageSlug)
}
