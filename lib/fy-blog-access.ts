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
