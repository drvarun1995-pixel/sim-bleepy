'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Database,
  Filter,
  GraduationCap,
  Layers,
  Lock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { FoundationYearSearch } from '@/components/foundation-year/FoundationYearSearch'
import { FY_COHORTS, FY_COHORT_META, type FyCohort } from '@/lib/foundation-year'
import { isMembersOnlyFyPage } from '@/lib/fy-blog-access'

type FyTopicRow = {
  id: string
  cohort: FyCohort
  name: string
  slug: string
}

type FyPageRow = {
  id: string
  title: string
  slug: string
  status?: string
  featured_image?: string | null
  updated_at?: string
  created_at?: string
  requires_auth?: boolean | null
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
  membersOnly: boolean
}

type CohortFilter = 'all' | FyCohort
type AccessFilter = 'all' | 'public' | 'members'
type SortMode = 'updated-desc' | 'updated-asc' | 'title-asc' | 'title-desc'

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

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'updated-desc', label: 'Newest updated' },
  { value: 'updated-asc', label: 'Oldest updated' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
]

export default function FoundationYearDatabasePage() {
  const { status } = useSession()
  const [topicChips, setTopicChips] = useState<HubTopicChip[]>([])
  const [articles, setArticles] = useState<HubArticle[]>([])
  const [loading, setLoading] = useState(true)

  const [cohortFilter, setCohortFilter] = useState<CohortFilter>('all')
  const [topicFilter, setTopicFilter] = useState<string>('all')
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('updated-desc')
  const [listQuery, setListQuery] = useState('')
  const deferredQuery = useDeferredValue(listQuery.trim().toLowerCase())

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const topicsRes = await fetch('/api/placements/foundation-year/topics')
        if (!topicsRes.ok) throw new Error('Failed to load topics')
        const topicsData = await topicsRes.json()
        const topics: FyTopicRow[] = topicsData.topics || []

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

        const rows: HubArticle[] = []
        for (const { topic, pages } of topicPageBundles) {
          for (const page of pages) {
            rows.push({
              id: page.id,
              title: page.title,
              slug: page.slug,
              topicSlug: topic.slug,
              topicName: topic.name,
              cohort: topic.cohort,
              featuredImage: page.featured_image || null,
              updatedAt: page.updated_at || page.created_at || '',
              membersOnly: isMembersOnlyFyPage(page),
            })
          }
        }

        const bySlug = new Map<string, HubArticle>()
        for (const article of rows) {
          const existing = bySlug.get(article.slug)
          if (!existing) {
            bySlug.set(article.slug, article)
            continue
          }
          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0
          const nextTime = article.updatedAt ? new Date(article.updatedAt).getTime() : 0
          if (nextTime > existingTime) bySlug.set(article.slug, article)
        }

        if (!cancelled) {
          setTopicChips(chips)
          setArticles(Array.from(bySlug.values()))
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setTopicChips([])
          setArticles([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status])

  const topicOptions = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; count: number }>()
    for (const chip of topicChips) {
      if (cohortFilter !== 'all' && chip.cohort !== cohortFilter) continue
      const prev = map.get(chip.slug)
      if (prev) {
        prev.count += chip.pageCount
        continue
      }
      map.set(chip.slug, { slug: chip.slug, name: chip.name, count: chip.pageCount })
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [topicChips, cohortFilter])

  useEffect(() => {
    if (topicFilter === 'all') return
    if (!topicOptions.some((t) => t.slug === topicFilter)) setTopicFilter('all')
  }, [topicOptions, topicFilter])

  const filteredArticles = useMemo(() => {
    let list = articles

    if (cohortFilter !== 'all') {
      list = list.filter((a) => a.cohort === cohortFilter)
    }
    if (topicFilter !== 'all') {
      list = list.filter((a) => a.topicSlug === topicFilter)
    }
    if (accessFilter === 'public') {
      list = list.filter((a) => !a.membersOnly)
    } else if (accessFilter === 'members') {
      list = list.filter((a) => a.membersOnly)
    }
    if (deferredQuery) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(deferredQuery) ||
          a.topicName.toLowerCase().includes(deferredQuery) ||
          a.slug.toLowerCase().includes(deferredQuery)
      )
    }

    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sortMode === 'title-asc') return a.title.localeCompare(b.title)
      if (sortMode === 'title-desc') return b.title.localeCompare(a.title)
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return sortMode === 'updated-asc' ? ta - tb : tb - ta
    })
    return sorted
  }, [articles, cohortFilter, topicFilter, accessFilter, deferredQuery, sortMode])

  const activeFilterCount =
    (cohortFilter !== 'all' ? 1 : 0) +
    (topicFilter !== 'all' ? 1 : 0) +
    (accessFilter !== 'all' ? 1 : 0) +
    (listQuery.trim() ? 1 : 0)

  if (status === 'loading') {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <LoadingScreen message="Loading Foundation Year..." fullScreen={false} />
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[84rem] space-y-6 px-4 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/placements/foundation-year">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to Foundation Year</span>
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
            <Database className="h-3.5 w-3.5" />
            Full database
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:mt-4 sm:gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-2xl">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg sm:h-14 sm:w-14">
                <GraduationCap className="h-5 w-5 text-white sm:h-7 sm:w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Foundation Year database
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-lg">
                Every published guide in one place — filter by cohort, topic and access, then sort
                without leaving the page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm sm:px-3 sm:py-1.5">
                <BookOpen className="h-3.5 w-3.5 text-teal-600" />
                {loading ? '…' : `${articles.length} guides`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm sm:px-3 sm:py-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                General · Basildon-Only
              </span>
            </div>
          </div>

          <div className="relative mt-4 min-w-0 sm:mt-5">
            <FoundationYearSearch className="w-full sm:max-w-xl" />
          </div>
        </div>
      </section>

      <section className="space-y-4 sm:space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-teal-700" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">All guides</h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredArticles.length}
                {!loading ? ` of ${articles.length}` : ''}
                {activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} on` : ''}
              </p>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-teal-800"
              onClick={() => {
                setCohortFilter('all')
                setTopicFilter('all')
                setAccessFilter('all')
                setListQuery('')
                setSortMode('updated-desc')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block min-w-0 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filter list
              </span>
              <input
                type="search"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                placeholder="Filter by title or topic…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="block min-w-0 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Topic
              </span>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              >
                <option value="all">All topics</option>
                {topicOptions.map((topic) => (
                  <option key={topic.slug} value={topic.slug}>
                    {topic.name} ({topic.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-0 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cohort
              </span>
              <select
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value as CohortFilter)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              >
                <option value="all">All cohorts</option>
                {FY_COHORTS.map((cohort) => (
                  <option key={cohort} value={cohort}>
                    {FY_COHORT_META[cohort].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-0 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Access
              </span>
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value as AccessFilter)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              >
                <option value="all">All access</option>
                <option value="public">Public / general</option>
                <option value="members">Members-only</option>
              </select>
            </label>

            <label className="block min-w-0 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sort
              </span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/80"
              />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-teal-500" />
            <p className="text-sm font-medium text-slate-800">No guides match these filters</p>
            <p className="mt-1 text-sm text-slate-500">Try clearing a filter or changing the sort.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            {filteredArticles.map((guide) => {
              const img = imageUrl(guide.featuredImage)
              return (
                <Link
                  key={guide.slug}
                  href={`/placements/foundation-year/${guide.cohort}/${guide.topicSlug}/${guide.slug}`}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md sm:flex-row"
                >
                  <div className="relative h-32 w-full shrink-0 bg-gradient-to-br from-teal-700 to-slate-800 sm:h-auto sm:w-28 md:w-32">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
                      {guide.membersOnly && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                          <Lock className="h-2.5 w-2.5" />
                          Members
                        </span>
                      )}
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
    </div>
  )
}
