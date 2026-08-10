/**
 * Host strategy (SEO / product):
 * - This app is the Basildon trust pilot and indexes only on sim.bleepy.co.uk.
 * - bleepy.co.uk is a separate business site — do not 301 or set cross-domain
 *   canonicals from this app to that host (or the reverse for overlapping pages).
 * - Future trusts (e.g. broomfield.bleepy.co.uk) each get their own origin,
 *   sitemap, and Search Console property.
 */
export const PRODUCTION_SITE_ORIGIN = 'https://sim.bleepy.co.uk'
export const BUSINESS_SITE_ORIGIN = 'https://bleepy.co.uk'

/** Canonical origin for this deployment (metadata, sitemap, robots, JSON-LD). */
export function getSiteOrigin(): string {
  const fromEnv = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '')
    .trim()
    .replace(/\/$/, '')
  return fromEnv || PRODUCTION_SITE_ORIGIN
}

export function absoluteUrl(path = ''): string {
  const origin = getSiteOrigin()
  if (!path) return origin
  if (/^https?:\/\//i.test(path)) return path
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
