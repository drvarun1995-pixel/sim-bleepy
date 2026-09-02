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

export function isLocalOrigin(origin: string) {
  try {
    const host = new URL(origin.includes('://') ? origin : `http://${origin}`).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
  } catch {
    return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(origin)
  }
}

/** Canonical origin for this deployment (metadata, sitemap, robots, JSON-LD). */
export function getSiteOrigin(): string {
  const fromEnv = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '')
    .trim()
    .replace(/\/$/, '')
  return fromEnv || PRODUCTION_SITE_ORIGIN
}

/**
 * Origin encoded into phone-facing public QRs.
 * Never localhost — generating on `npm run dev` must still encode the live site.
 */
export function getPublicSiteOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    PRODUCTION_SITE_ORIGIN,
  ]
  for (const value of candidates) {
    if (!value) continue
    const origin = value.trim().replace(/\/$/, '')
    if (!origin || isLocalOrigin(origin)) continue
    return origin
  }
  return PRODUCTION_SITE_ORIGIN
}

export function buildAttendanceScanUrl(eventId: string) {
  return `${getPublicSiteOrigin()}/scan-attendance-smart?event=${eventId}`
}

export function absoluteUrl(path = ''): string {
  const origin = getSiteOrigin()
  if (!path) return origin
  if (/^https?:\/\//i.test(path)) return path
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
