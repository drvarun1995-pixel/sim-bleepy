'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Clock,
  GraduationCap,
  Layers,
  Sparkles,
  Stethoscope,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { FoundationYearSearch } from '@/components/foundation-year/FoundationYearSearch'
import { FY_COHORTS, FY_COHORT_META, type FyCohort } from '@/lib/foundation-year'

const COHORT_VISUAL: Record<
  FyCohort,
  { icon: typeof GraduationCap; accent: string; chip: string }
> = {
  general: {
    icon: Layers,
    accent: 'from-teal-500 to-cyan-600',
    chip: 'bg-teal-50 text-teal-800 border-teal-100',
  },
  basildon: {
    icon: Building2,
    accent: 'from-amber-500 to-orange-600',
    chip: 'bg-amber-50 text-amber-900 border-amber-100',
  },
  fy1: {
    icon: Stethoscope,
    accent: 'from-blue-500 to-indigo-600',
    chip: 'bg-blue-50 text-blue-800 border-blue-100',
  },
  fy2: {
    icon: GraduationCap,
    accent: 'from-violet-500 to-purple-600',
    chip: 'bg-violet-50 text-violet-800 border-violet-100',
  },
}

type FyTopicRow = {
  id: string
  cohort: FyCohort
  name: string
  slug: string
  display_order?: number
}

type FyPageRow = {
  id: string
  title: string
  slug: string
  status?: string
  featured_image?: string | null
  updated_at?: string
  created_at?: string
}

type HubTopicChip = {
  key: string
  name: string
  slug: string
  cohort: FyCohort
  pageCount: number
}

type HubArticle = {
  id: string
  title: string
  slug: string
  topicSlug: string
  topicName: string
  cohort: FyCohort
  featuredImage?: string | null
  updatedAt: string
}

function imageUrl(path?: string | null) {
  if (!path) return null
  return `/api/placements/images/view?path=${encodeURIComponent(path)}`
}

function formatUpdated(iso: string) {
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

export default function FoundationYearHubPage() {
  const { status } = useSession()
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({})
  const [topicChips, setTopicChips] = useState<HubTopicChip[]>([])
  const [recentGuides, setRecentGuides] = useState<HubArticle[]>([])
  const [loadingExtras, setLoadingExtras] = useState(true)

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false
    ;(async () => {
      try {
        setLoadingExtras(true)

        const topicsRes = await fetch('/api/placements/foundation-year/topics')
        if (!topicsRes.ok) throw new Error('Failed to load topics')
        const topicsData = await topicsRes.json()
        const topics: FyTopicRow[] = topicsData.topics || []

        const counts: Record<string, number> = {
          general: 0,
          basildon: 0,
          fy1: 0,
          fy2: 0,
        }
        for (const t of topics) {
          if (counts[t.cohort] !== undefined) counts[t.cohort] += 1
        }

        const topicPageBundles = await Promise.all(
          topics.map(async (topic) => {
            try {
              const res = await fetch(
                `/api/placements/foundation-year/pages?cohort=${topic.cohort}&topicSlug=${topic.slug}`
              )
              if (!res.ok) return { topic, pages: [] as FyPageRow[] }
              const data = await res.json()
              const pages: FyPageRow[] = (data.pages || []).filter(
                (p: FyPageRow) => !p.status || p.status === 'published'
              )
              return { topic, pages }
            } catch {
              return { topic, pages: [] as FyPageRow[] }
            }
          })
        )

        // Topic chips: one per cohort+topic that has pages
        const chips: HubTopicChip[] = topicPageBundles
          .filter(({ pages }) => pages.length > 0)
          .map(({ topic, pages }) => ({
            key: `${topic.cohort}:${topic.slug}`,
            name: topic.name,
            slug: topic.slug,
            cohort: topic.cohort,
            pageCount: pages.length,
          }))
          .sort(
            (a, b) =>
              FY_COHORTS.indexOf(a.cohort) - FY_COHORTS.indexOf(b.cohort) ||
              b.pageCount - a.pageCount ||
              a.name.localeCompare(b.name)
          )

        const articles: HubArticle[] = []
        for (const { topic, pages } of topicPageBundles) {
          for (const page of pages) {
            articles.push({
              id: page.id,
              title: page.title,
              slug: page.slug,
              topicSlug: topic.slug,
              topicName: topic.name,
              cohort: topic.cohort,
              featuredImage: page.featured_image || null,
              updatedAt: page.updated_at || page.created_at || '',
            })
          }
        }

        // One card per slug (posts are unique across cohorts after reorg).
        const bySlug = new Map<string, HubArticle>()
        for (const article of articles) {
          const existing = bySlug.get(article.slug)
          if (!existing) {
            bySlug.set(article.slug, article)
            continue
          }
          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0
          const nextTime = article.updatedAt ? new Date(article.updatedAt).getTime() : 0
          if (nextTime > existingTime) bySlug.set(article.slug, article)
        }

        const uniqueArticles = Array.from(bySlug.values()).sort((a, b) => {
          const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          return tb - ta
        })

        if (!cancelled) {
          setTopicCounts(counts)
          setTopicChips(chips)
          setRecentGuides(uniqueArticles.slice(0, 4))
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setTopicChips([])
          setRecentGuides([])
        }
      } finally {
        if (!cancelled) setLoadingExtras(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status])

  const hasTopicChips = topicChips.length > 0
  const hasRecent = recentGuides.length > 0

  const recentHeading = useMemo(
    () => (hasRecent ? 'Recently updated guides' : null),
    [hasRecent]
  )

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingScreen message="Loading Foundation Year..." fullScreen={false} />
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-[84rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/placements">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to Placements</span>
          </Link>
        </Button>
      </div>

      <section className="relative rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-blue-50 shadow-sm">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-blue-200/30 blur-3xl" />
        </div>

        <div className="relative px-4 py-6 sm:px-8 sm:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700 shadow-sm sm:px-3 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Resources
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:mt-4 sm:gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-2xl">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg sm:h-14 sm:w-14">
                <GraduationCap className="h-5 w-5 text-white sm:h-7 sm:w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Foundation Year
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-lg">
                Practical guides for settling in, on-calls, clerking, and day-to-day foundation
                training — organised by cohort.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm sm:px-3 sm:py-1.5">
                <BookOpen className="h-3.5 w-3.5 text-teal-600" />
                Guides & articles
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm sm:px-3 sm:py-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                General · FY1 · FY2
              </span>
            </div>
          </div>
          <div className="relative mt-4 min-w-0 sm:mt-5">
            <FoundationYearSearch />
          </div>
        </div>
      </section>

      {hasTopicChips && (
        <section className="space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2 px-0.5">
            <Tag className="h-4 w-4 text-teal-700" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Browse by topic</h2>
              <p className="mt-1 text-sm text-slate-500">Jump straight into a popular topic area.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {topicChips.map((topic) => (
              <Link
                key={topic.key}
                href={`/placements/foundation-year/${topic.cohort}/${topic.slug}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900 sm:gap-2 sm:px-3.5 sm:py-2"
              >
                <span className="truncate">{topic.name}</span>
                <span className="shrink-0 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
                  {topic.pageCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 sm:space-y-5">
        <div className="flex items-end justify-between gap-3 px-0.5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Choose your cohort</h2>
            <p className="mt-1 text-sm text-slate-500">
              Start with General for shared guidance, or open FY1 / FY2 for year-specific topics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
          {FY_COHORTS.map((cohort) => {
            const meta = FY_COHORT_META[cohort]
            const visual = COHORT_VISUAL[cohort]
            const Icon = visual.icon
            const count = topicCounts[cohort]

            return (
              <Link
                key={cohort}
                href={`/placements/foundation-year/${cohort}`}
                className="group relative flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md sm:p-5"
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${visual.accent} text-white shadow-md sm:mb-4 sm:h-11 sm:w-11`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{meta.label}</h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${visual.chip}`}
                  >
                    {meta.shortLabel}
                  </span>
                </div>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600 sm:mb-5">
                  {meta.description}
                </p>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 sm:pt-3">
                  <span className="text-xs font-medium text-slate-500">
                    {typeof count === 'number'
                      ? `${count} topic${count === 1 ? '' : 's'}`
                      : 'Browse topics'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 transition group-hover:gap-1.5">
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {(hasRecent || loadingExtras) && (
        <section className="space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2 px-0.5">
            <Clock className="h-4 w-4 text-teal-700" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {recentHeading || 'Recently updated guides'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest published Foundation Year articles.
              </p>
            </div>
          </div>

          {loadingExtras && !hasRecent ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/80"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              {recentGuides.map((guide) => {
                const img = imageUrl(guide.featuredImage)
                return (
                  <Link
                    key={guide.slug}
                    href={`/placements/foundation-year/${guide.cohort}/${guide.topicSlug}/${guide.slug}`}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md sm:flex-row"
                  >
                    <div className="relative h-32 w-full shrink-0 bg-gradient-to-br from-teal-700 to-slate-800 sm:h-auto sm:w-28 md:w-32">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full min-h-[8rem] items-center justify-center text-white/80 sm:min-h-[7rem]">
                          <BookOpen className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3.5 sm:p-4">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800">
                          {FY_COHORT_META[guide.cohort].shortLabel}
                        </span>
                        <span className="truncate text-xs text-slate-500">{guide.topicName}</span>
                      </div>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-teal-900 sm:text-base">
                        {guide.title}
                      </h3>
                      {guide.updatedAt && (
                        <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3 shrink-0" />
                          Updated {formatUpdated(guide.updatedAt)}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
