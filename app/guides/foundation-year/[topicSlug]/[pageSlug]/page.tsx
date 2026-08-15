import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, GraduationCap } from 'lucide-react'
import type { Metadata } from 'next'
import {
  getPublicFyPage,
  listAllPublicFyPages,
  listPublicFyPagesForTopicSlug,
} from '@/lib/fy-public-guides'
import { featuredImageViewUrl, rewriteFyContentImages, stripHtmlToDescription } from '@/lib/fy-public-html'
import { fyMetaDescription } from '@/lib/fy-meta-descriptions'
import { publicGuidePath, publicGuideTopicPath } from '@/lib/fy-blog-access'
import { FyBlogTracker } from '@/components/foundation-year/FyBlogTracker'
import { ArticleAfterword } from '@/components/foundation-year/ArticleAfterword'
import { FyFaqAccordion } from '@/components/FyFaqAccordion'
import {
  RelatedPostsCarousel,
  type RelatedFyPost,
} from '@/components/foundation-year/RelatedPostsCarousel'
import { absoluteUrl } from '@/lib/site-url'
import {
  buildFaqPageJsonLd,
  extractFyFaqItems,
  hasInlineFyFaqAccordion,
  shouldEmitFyFaqSchema,
} from '@/lib/fy-faq-schema'
import { FY_OG_SIZE, publicFyOgImagePath } from '@/lib/fy-og-image'

export const revalidate = 60

type Props = { params: { topicSlug: string; pageSlug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPublicFyPage(params.topicSlug, params.pageSlug)
  if (!page) return { title: 'Guide not found | Bleepy' }

  const description =
    fyMetaDescription(page.slug, page.content || page.title, page.meta_description) ||
    stripHtmlToDescription(page.content || page.title)
  const canonical = absoluteUrl(
    publicGuidePath(page.canonicalTopicSlug || params.topicSlug, params.pageSlug)
  )
  // Explicit absolute JPEG URL (no /api, no ?hash) — X/Twitter is picky about this.
  const ogImageUrl = absoluteUrl(
    publicFyOgImagePath(page.canonicalTopicSlug || params.topicSlug, params.pageSlug)
  )
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

  if (page.canonicalTopicSlug !== params.topicSlug) {
    redirect(publicGuidePath(page.canonicalTopicSlug, page.slug))
  }

  const [topicPages, allPublic] = await Promise.all([
    listPublicFyPagesForTopicSlug(page.topic.slug),
    listAllPublicFyPages(),
  ])

  const currentIdx = topicPages.findIndex((p) => p.id === page.id)
  const nextInTopic = currentIdx >= 0 ? topicPages[currentIdx + 1] : undefined

  const nextPost: RelatedFyPost | null = nextInTopic
    ? {
        id: nextInTopic.id,
        title: nextInTopic.title,
        slug: nextInTopic.slug,
        topicSlug: page.topic.slug,
        topicName: page.topic.name,
        featuredImage: nextInTopic.featured_image,
      }
    : null

  const relatedPosts: RelatedFyPost[] = []
  const seen = new Set<string>([page.id])
  for (const p of topicPages) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    relatedPosts.push({
      id: p.id,
      title: p.title,
      slug: p.slug,
      topicSlug: page.topic.slug,
      topicName: page.topic.name,
      featuredImage: p.featured_image,
    })
  }
  for (const p of allPublic) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    relatedPosts.push({
      id: p.id,
      title: p.title,
      slug: p.slug,
      topicSlug: p.topic_slug,
      topicName: p.topic_name,
      featuredImage: p.featured_image,
    })
    if (relatedPosts.length >= 12) break
  }

  const html = rewriteFyContentImages(
    page.content || '',
    `${page.title} — guide illustration`
  )
  // Cap hero at 1280w WebP via view API — preserves quality, avoids oversized originals.
  const featured = featuredImageViewUrl(page.featured_image, 1280)
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
    description:
      fyMetaDescription(page.slug, page.content || page.title, page.meta_description) ||
      stripHtmlToDescription(page.content || page.title),
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
  // Avoid duplicating Rank Math / inline FAQ accordions already in the article body.
  const showFaqUi = showFaq && !hasInlineFyFaqAccordion(page.content || '')

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

      <article className="max-w-[1230px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
              sizes="(max-width: 640px) 100vw, 1230px"
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
          className="fy-article-content placements-content prose prose-slate max-w-none sm:prose-lg prose-headings:font-semibold"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {showFaqUi && (
          <FyFaqAccordion
            className="mt-12 border-t border-slate-100 pt-8"
            heading="Common questions"
            items={faqItems}
          />
        )}
      </article>

      {/* Match placements afterword UX; keep public links + soft sign-in CTA */}
      <div className="max-w-[1230px] mx-auto px-4 sm:px-6 pb-12 space-y-4 pt-2">
        <div className="flex items-center gap-3 px-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700/80">
            End of article
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
        </div>

        <ArticleAfterword
          pageId={page.id}
          cohort="general"
          topicSlug={page.topic.slug}
          topicName={page.topic.name}
          nextPost={nextPost}
          surface="public"
        />

        <RelatedPostsCarousel posts={relatedPosts} cohort="general" surface="public" />

        <aside className="rounded-xl border border-teal-100 bg-teal-50/60 p-5 sm:p-6">
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
      </div>
    </div>
  )
}
