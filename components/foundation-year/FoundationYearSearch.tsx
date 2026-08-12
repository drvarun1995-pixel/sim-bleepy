'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { BookOpen, FileText, Loader2, Search, X } from 'lucide-react'
import { FY_COHORT_META, type FyCohort } from '@/lib/foundation-year'
import { cn } from '@/utils'

type SearchTopic = {
  id: string
  cohort: FyCohort
  name: string
  slug: string
  description?: string | null
}

type SearchPage = {
  id: string
  title: string
  slug: string
  cohort: FyCohort
  topicSlug: string
  topicName: string
  featuredImage?: string | null
}

type Props = {
  cohort?: FyCohort
  topicSlug?: string
  placeholder?: string
  /** Shorter placeholder used below the `sm` breakpoint */
  mobilePlaceholder?: string
  className?: string
  /** Public guides hub: no auth, links to /guides/... */
  mode?: 'placements' | 'public'
}

export function FoundationYearSearch({
  cohort,
  topicSlug,
  placeholder = 'Search Foundation Year guides…',
  mobilePlaceholder = 'Search guides…',
  className,
  mode = 'placements',
}: Props) {
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [topics, setTopics] = useState<SearchTopic[]>([])
  const [pages, setPages] = useState<SearchPage[]>([])
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (debounced.length < 2) {
      setTopics([])
      setPages([])
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ q: debounced, limit: '10' })
        if (mode === 'placements' && cohort) params.set('cohort', cohort)
        if (topicSlug) params.set('topicSlug', topicSlug)

        const endpoint =
          mode === 'public'
            ? `/api/guides/foundation-year/search?${params}`
            : `/api/placements/foundation-year/search?${params}`

        const res = await fetch(endpoint)
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        if (cancelled) return
        setTopics(data.topics || [])
        setPages(data.pages || [])
        setOpen(true)
      } catch {
        if (!cancelled) {
          setTopics([])
          setPages([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debounced, cohort, topicSlug, mode])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const hasQuery = debounced.length >= 2
  const empty = hasQuery && !loading && topics.length === 0 && pages.length === 0
  const showPanel = open && (loading || hasQuery)

  return (
    <div ref={rootRef} className={cn('relative z-20 w-full min-w-0 max-w-full sm:max-w-xl', className)}>
      <label htmlFor={inputId} className="sr-only">
        Search Foundation Year
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-700/70" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={isDesktop ? placeholder : mobilePlaceholder}
          autoComplete="off"
          className="w-full rounded-xl border border-teal-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setDebounced('')
              setTopics([])
              setPages([])
              setOpen(false)
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-[min(22rem,55vh)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:max-h-[min(24rem,60vh)]">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500 sm:px-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          )}

          {!loading && empty && (
            <div className="px-3 py-3 text-sm text-slate-500 sm:px-4">
              No matches for “{debounced}”.
            </div>
          )}

          {!loading && !empty && (
            <div className="max-h-[min(22rem,55vh)] overflow-y-auto overscroll-contain py-1 sm:max-h-[min(24rem,60vh)]">
              {pages.length > 0 && (
                <div className="px-1.5 py-1 sm:px-2">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Guides
                  </p>
                  <ul>
                    {pages.map((page) => (
                      <li key={page.id}>
                        <Link
                          href={
                            mode === 'public'
                              ? `/guides/foundation-year/${page.topicSlug}/${page.slug}`
                              : `/placements/foundation-year/${page.cohort}/${page.topicSlug}/${page.slug}`
                          }
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-2.5 rounded-lg px-2 py-2.5 hover:bg-teal-50 sm:gap-3"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                            <FileText className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium leading-snug text-slate-900 line-clamp-2">
                              {page.title}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {mode === 'public'
                                ? page.topicName
                                : `${FY_COHORT_META[page.cohort]?.shortLabel || page.cohort} · ${page.topicName}`}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {topics.length > 0 && (
                <div className="border-t border-slate-100 px-1.5 py-1 sm:px-2">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Topics
                  </p>
                  <ul>
                    {topics.map((topic) => (
                      <li key={topic.id}>
                        <Link
                          href={
                            mode === 'public'
                              ? `/guides/foundation-year/${topic.slug}`
                              : `/placements/foundation-year/${topic.cohort}/${topic.slug}`
                          }
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-2.5 rounded-lg px-2 py-2.5 hover:bg-teal-50 sm:gap-3"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <BookOpen className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-900">
                              {topic.name}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {mode === 'public'
                                ? 'Foundation Year'
                                : FY_COHORT_META[topic.cohort]?.label || topic.cohort}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
