import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, Lock } from 'lucide-react'
import { listAllPublicFyPages, listPublicFyTopics } from '@/lib/fy-public-guides'
import { featuredImageViewUrl } from '@/lib/fy-public-html'
import { publicGuidePath, publicGuideTopicPath } from '@/lib/fy-blog-access'
import { absoluteUrl } from '@/lib/site-url'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const guidesHub = absoluteUrl('/guides/foundation-year')

export const metadata: Metadata = {
  title: { absolute: 'Foundation Year Guides for NHS Doctors | Bleepy' },
  description:
    'Free Foundation Year guides for NHS doctors: on-calls, DNAR/DNACPR, clerking skills, settling into the NHS, and where to seek support.',
  alternates: { canonical: guidesHub },
  openGraph: {
    title: 'Foundation Year Guides for NHS Doctors | Bleepy',
    description:
      'Free Foundation Year guides for NHS doctors: on-calls, clerking skills, settling into the NHS, and support.',
    url: guidesHub,
    type: 'website',
  },
}

function formatUpdated(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default async function PublicFoundationYearHubPage() {
  const [topics, pages] = await Promise.all([
    listPublicFyTopics(),
    listAllPublicFyPages(),
  ])

  const countByTopic = new Map<string, number>()
  for (const p of pages) {
    countByTopic.set(p.topic_slug, (countByTopic.get(p.topic_slug) || 0) + 1)
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-teal-50/40 min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-teal-800 bg-teal-50 border border-teal-100 rounded-full px-3 py-1 mb-4">
            <GraduationCap className="h-4 w-4" />
            Foundation Year
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Foundation Year Guides
          </h1>
          <p className="mt-3 text-slate-600 text-base sm:text-lg leading-relaxed">
            Practical guides for settling into the NHS, working on-calls, clerking, and finding
            support. Free to read — no account required.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/auth/signin?callbackUrl=/placements/foundation-year"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5"
            >
              Sign in for the full hub
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-slate-500 self-center flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Some trust induction pages stay members-only
            </p>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Topics</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={publicGuideTopicPath(topic.slug)}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-teal-800">
                      {topic.name}
                    </h3>
                    {topic.description && (
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                        {topic.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2 py-1 shrink-0">
                    {countByTopic.get(topic.slug) || 0} guides
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-700" />
            Latest guides
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.slice(0, 12).map((page) => {
              const img = featuredImageViewUrl(page.featured_image)
              return (
                <Link
                  key={page.id}
                  href={publicGuidePath(page.topic_slug, page.slug)}
                  className="group rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-teal-300 hover:shadow-sm transition"
                >
                  <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={`${page.title} — Foundation Year guide`}
                        width={640}
                        height={400}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.02] transition"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <BookOpen className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-teal-700 mb-1">{page.topic_name}</p>
                    <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-teal-800">
                      {page.title}
                    </h3>
                    {page.updated_at && (
                      <p className="mt-2 text-xs text-slate-500">
                        Updated {formatUpdated(page.updated_at)}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          {!pages.length && (
            <p className="text-sm text-slate-500">No public guides published yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
