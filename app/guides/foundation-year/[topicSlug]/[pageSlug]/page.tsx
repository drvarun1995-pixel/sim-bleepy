import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, GraduationCap } from 'lucide-react'
import type { Metadata } from 'next'
import { getPublicFyPage, listPublicFyPagesForTopic } from '@/lib/fy-public-guides'
import { featuredImageViewUrl, rewriteFyContentImages, stripHtmlToDescription } from '@/lib/fy-public-html'
import { publicGuidePath, publicGuideTopicPath } from '@/lib/fy-blog-access'
import { FyBlogTracker } from '@/components/foundation-year/FyBlogTracker'
import { ScrollableTables } from '@/components/ScrollableTables'
import { absoluteUrl } from '@/lib/site-url'
import {
  buildFaqPageJsonLd,
  extractFyFaqItems,
  shouldEmitFyFaqSchema,
} from '@/lib/fy-faq-schema'
import { FY_OG_SIZE, publicFyOgImagePath } from '@/lib/fy-og-image'

export const dynamic = 'force-dynamic'

type Props = { params: { topicSlug: string; pageSlug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPublicFyPage(params.topicSlug, params.pageSlug)
  if (!page) return { title: 'Guide not found | Bleepy' }

  const description = stripHtmlToDescription(page.content || page.title)
  const canonical = absoluteUrl(publicGuidePath(params.topicSlug, params.pageSlug))
  // Explicit absolute JPEG URL (no /api, no ?hash) — X/Twitter is picky about this.
  const ogImageUrl = absoluteUrl(publicFyOgImagePath(params.topicSlug, params.pageSlug))
  const ogImage = {
    url: ogImageUrl,
    width: FY_OG_SIZE.width,
    height: FY_OG_SIZE.height,
    alt: page.title,
    type: 'image/jpeg',
  }

  const title = `${page.title} | Foundation Year Guides | Bleepy`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title: page.title,
      description,
      url: canonical,
      type: 'article',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: FY_OG_SIZE.width,
          height: FY_OG_SIZE.height,
          alt: page.title,
        },
      ],
    },
  }
}

export default async function PublicFyArticlePage({ params }: Props) {
  const page = await getPublicFyPage(params.topicSlug, params.pageSlug)
  if (!page) notFound()

  const related = (await listPublicFyPagesForTopic(page.topic.id))
    .filter((p) => p.id !== page.id)
    .slice(0, 4)

  const html = rewriteFyContentImages(
    page.content || '',
    `${page.title} — guide illustration`
  )
  const featured = featuredImageViewUrl(page.featured_image)
  const featuredAlt = `${page.title} — Foundation Year guide`
  const updatedLabel = page.updated_at
    ? new Date(page.updated_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: stripHtmlToDescription(page.content || page.title),
    dateModified: page.updated_at || undefined,
    datePublished: page.created_at || undefined,
    author: { '@type': 'Organization', name: 'Bleepy' },
    publisher: { '@type': 'Organization', name: 'Bleepy' },
    mainEntityOfPage: absoluteUrl(publicGuidePath(params.topicSlug, params.pageSlug)),
    url: absoluteUrl(publicGuidePath(params.topicSlug, params.pageSlug)),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Foundation Year Guides',
        item: absoluteUrl('/guides/foundation-year'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.topic.name,
        item: absoluteUrl(publicGuideTopicPath(params.topicSlug)),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: page.title,
      },
    ],
  }

  const faqItems = extractFyFaqItems(page.content || '')
  const showFaq = shouldEmitFyFaqSchema(page.content || '', faqItems)
  const faqLd = showFaq ? buildFaqPageJsonLd(faqItems) : null

  return (
    <div className="bg-white min-h-[70vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <FyBlogTracker pageId={page.id} pageSlug={page.slug} pageTitle={page.title} />
      <ScrollableTables />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
          <ol className="flex flex-wrap gap-x-1.5 gap-y-1 list-none m-0 p-0">
            <li>
              <Link href="/guides/foundation-year" className="hover:text-teal-700">
                Foundation Year Guides
              </Link>
            </li>
            <li>
              <span className="text-slate-400 mx-1">/</span>
              <Link
                href={publicGuideTopicPath(params.topicSlug)}
                className="hover:text-teal-700"
              >
                {page.topic.name}
              </Link>
            </li>
            <li>
              <span className="text-slate-400 mx-1">/</span>
              <span className="text-slate-800 font-medium">{page.title}</span>
            </li>
          </ol>
        </nav>

        <Link
          href={publicGuideTopicPath(params.topicSlug)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-teal-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {page.topic.name}
        </Link>

        {featured ? (
          <header className="relative w-full overflow-hidden rounded-2xl bg-slate-900 min-h-[14rem] sm:min-h-[17rem] mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured}
              alt={featuredAlt}
              width={1280}
              height={720}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-900/20" />
            <div className="relative z-10 flex min-h-[14rem] sm:min-h-[17rem] flex-col justify-end p-6 sm:p-8">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/90 mb-3">
                <GraduationCap className="h-3.5 w-3.5" />
                {page.topic.name}
              </p>
              <h1 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight text-balance">
                {page.title}
              </h1>
              {updatedLabel && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/75">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {updatedLabel}
                </p>
              )}
            </div>
          </header>
        ) : (
          <header className="mb-8">
            <p className="text-sm font-medium text-teal-700 mb-2">{page.topic.name}</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              {page.title}
            </h1>
            {updatedLabel && (
              <p className="mt-3 text-sm text-slate-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Updated {updatedLabel}
              </p>
            )}
          </header>
        )}

        <div
          className="fy-article-content placements-content prose prose-slate max-w-none sm:prose-lg prose-headings:font-semibold prose-a:text-teal-700"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {showFaq && (
          <section className="mt-12 border-t border-slate-100 pt-8" aria-labelledby="fy-faq-heading">
            <h2 id="fy-faq-heading" className="text-lg font-semibold text-slate-900 mb-4">
              Common questions
            </h2>
            <div className="space-y-3">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 open:bg-white open:shadow-sm"
                >
                  <summary className="cursor-pointer list-none font-medium text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden flex items-start justify-between gap-3">
                    <span>{item.question}</span>
                    <span className="text-slate-400 group-open:rotate-45 transition text-xl leading-none shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <aside className="mt-12 rounded-xl border border-teal-100 bg-teal-50/60 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-teal-950">Want the full Foundation Year hub?</h2>
          <p className="mt-1 text-sm text-teal-900/80">
            Sign in for cohort-specific topics, members-only inductions, and your personalised
            teaching hub.
          </p>
          <Link
            href="/auth/signin?callbackUrl=/placements/foundation-year"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>

        {related.length > 0 && (
          <section className="mt-12 border-t border-slate-100 pt-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Related guides</h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={publicGuidePath(params.topicSlug, r.slug)}
                    className="text-teal-800 hover:underline font-medium"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  )
}
