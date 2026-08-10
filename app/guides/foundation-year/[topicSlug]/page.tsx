import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  getPublicFyTopicBySlug,
  listPublicFyPagesForTopic,
} from '@/lib/fy-public-guides'
import { featuredImageViewUrl } from '@/lib/fy-public-html'
import { publicGuidePath } from '@/lib/fy-blog-access'
import { buildPageMetadata } from '@/lib/seo'
import { FyPageGrid } from '@/components/foundation-year/FyPageGrid'
import type { Metadata } from 'next'

export const revalidate = 300

type Props = { params: { topicSlug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await getPublicFyTopicBySlug(params.topicSlug)
  if (!topic) return { title: 'Topic not found | Bleepy' }
  return buildPageMetadata({
    title: `${topic.name} | Foundation Year Guides | Bleepy`,
    description:
      topic.description ||
      `Foundation Year guides on ${topic.name} for NHS junior doctors — free to read on Bleepy.`,
    path: `/guides/foundation-year/${topic.slug}`,
  })
}

export default async function PublicFyTopicPage({ params }: Props) {
  const topic = await getPublicFyTopicBySlug(params.topicSlug)
  if (!topic) notFound()

  const pages = await listPublicFyPagesForTopic(topic.id)

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-white min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <Link
          href="/guides/foundation-year"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-teal-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          All Foundation Year guides
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{topic.name}</h1>
        {topic.description && (
          <p className="mt-2 text-slate-600 max-w-2xl">{topic.description}</p>
        )}

        <FyPageGrid
          emptyMessage="No public guides in this topic yet."
          items={pages.map((page) => ({
            id: page.id,
            href: publicGuidePath(topic.slug, page.slug),
            title: page.title,
            imageUrl: featuredImageViewUrl(page.featured_image, 640),
          }))}
        />
      </div>
    </div>
  )
}
