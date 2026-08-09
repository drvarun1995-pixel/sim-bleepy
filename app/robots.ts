import type { MetadataRoute } from 'next'

/**
 * Prevent search engines from crawling authenticated / file / API surfaces.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/auth/', '/help', '/tutorials', '/contact'],
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
          // Hospital induction & other members-only FY slugs (defense in depth)
          '/*trust-induction-basildon-hospital*',
        ],
      },
    ],
    sitemap: undefined,
  }
}
