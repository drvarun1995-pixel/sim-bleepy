import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import {
  getPublicFyTopicBySlug,
  listPublicFyPagesForTopic,
} from '@/lib/fy-public-guides'
import { featuredImageViewUrl } from '@/lib/fy-public-html'
import { publicGuidePath } from '@/lib/fy-blog-access'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

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

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => {
            const img = featuredImageViewUrl(page.featured_image)
            return (
              <Link
                key={page.id}
                href={publicGuidePath(topic.slug, page.slug)}
                className="group rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-teal-300 hover:shadow-sm transition"
              >
                <div className="aspect-[16/10] bg-slate-100 relative">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={`${page.title} — Foundation Year guide`}
                      width={640}
                      height={400}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <BookOpen className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-teal-800">
                    {page.title}
                  </h2>
                </div>
              </Link>
            )
          })}
        </div>

        {!pages.length && (
          <p className="mt-8 text-sm text-slate-500">No public guides in this topic yet.</p>
        )}
      </div>
    </div>
  )
}
