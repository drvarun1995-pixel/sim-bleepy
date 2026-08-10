import type { MetadataRoute } from 'next'
import { getSiteOrigin } from '@/lib/site-url'

/**
 * Allow marketing + public Foundation Year guides; keep private shells out of the index.
 * Sitemap is always this host (sim.bleepy.co.uk in production) — never bleepy.co.uk.
 */
export default function robots(): MetadataRoute.Robots {
  const site = getSiteOrigin()

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/auth/',
          '/help',
          '/tutorials',
          '/contact',
          '/guides',
          '/guides/',
          '/announcements',
          '/privacy',
          '/cookies',
          '/terms',
        ],
        disallow: [
          '/api/',
          '/dashboard',
          '/downloads',
          '/placements',
          '/placements/',
          '/blog-analytics',
          '/admin',
          '/admin-*',
          '/certificates/',
          '/portfolio',
          '/teaching-portfolio',
          '/imt-portfolio',
          '/event-data',
          '/emails',
          '/history',
          '/onboarding',
          '/games-organiser',
          '/bulk-upload',
          '/user/',
          '/auth/signin',
          // Members-only FY slugs (defence in depth if ever linked publicly)
          '/*trust-induction-basildon-hospital*',
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  }
}
