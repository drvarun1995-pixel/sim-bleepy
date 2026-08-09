/** Slugs that must never be public / crawlable, even before DB flag syncs. */
export const FY_MEMBERS_ONLY_SLUGS = new Set(['trust-induction-basildon-hospital'])

export function isMembersOnlyFyPage(page: {
  slug?: string | null
  requires_auth?: boolean | null
}): boolean {
  if (page.requires_auth === true) return true
  if (page.slug && FY_MEMBERS_ONLY_SLUGS.has(page.slug)) return true
  return false
}
