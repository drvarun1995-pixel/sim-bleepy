import type { MetadataRoute } from 'next'
import { listAllPublicFyPages, listPublicFyTopics } from '@/lib/fy-public-guides'
import { publicGuidePath, publicGuideTopicPath } from '@/lib/fy-blog-access'
import { getSiteOrigin } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

const SITE = getSiteOrigin()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/contact',
    '/tutorials',
    '/help',
    '/announcements',
    '/privacy',
    '/cookies',
    '/terms',
    '/guides/foundation-year',
  ].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path.startsWith('/guides') ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/guides') ? 0.9 : 0.6,
  }))

  let guideEntries: MetadataRoute.Sitemap = []
  try {
    const [topics, pages] = await Promise.all([
      listPublicFyTopics(),
      listAllPublicFyPages(),
    ])

    const topicEntries: MetadataRoute.Sitemap = topics.map((t) => ({
      url: `${SITE}${publicGuideTopicPath(t.slug)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const pageEntries: MetadataRoute.Sitemap = pages.map((p) => ({
      url: `${SITE}${publicGuidePath(p.topic_slug, p.slug)}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }))

    guideEntries = [...topicEntries, ...pageEntries]
  } catch (error) {
    console.error('sitemap FY guides error:', error)
  }

  return [...staticRoutes, ...guideEntries]
}
