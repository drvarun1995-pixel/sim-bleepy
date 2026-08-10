'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, GraduationCap, Sparkles } from 'lucide-react'
import type { FyCohort } from '@/lib/foundation-year'

export type RelatedFyPost = {
  id: string
  title: string
  slug: string
  topicSlug: string
  topicName: string
  featuredImage?: string | null
}

type Props = {
  posts: RelatedFyPost[]
  cohort: FyCohort
  /** Public surface links to /guides instead of /placements. */
  surface?: 'placements' | 'public'
}

const AUTO_ADVANCE_MS = 4000
const DESKTOP_CARD_STEP_PX = 296 // ~280 card + 16 gap
const DESKTOP_MQ = '(min-width: 640px)'

function imageUrl(path?: string | null) {
  if (!path) return null
  // Carousel thumbs are ~280–320px wide — request a small WebP via the view API.
  return `/api/placements/images/view?path=${encodeURIComponent(path)}&w=320`
}

function RelatedCard({
  post,
  cohort,
  surface = 'placements',
  className,
}: {
  post: RelatedFyPost
  cohort: FyCohort
  surface?: 'placements' | 'public'
  className?: string
}) {
  const href =
    surface === 'public'
      ? `/guides/foundation-year/${post.topicSlug}/${post.slug}`
      : `/placements/foundation-year/${cohort}/${post.topicSlug}/${post.slug}`
  const img = imageUrl(post.featuredImage)

  return (
    <Link
      href={href}
      className={`group overflow-hidden rounded-xl border border-white/80 bg-white shadow-md transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className || ''}`}
    >
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-teal-700 to-slate-800 sm:h-40">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            width={320}
            height={160}
            sizes="(max-width: 640px) 90vw, 280px"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/80">
            <GraduationCap className="h-10 w-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
          {post.topicName}
        </span>
      </div>
      <div className="space-y-1.5 p-3.5 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-teal-800 sm:text-base">
          {post.title}
        </h3>
        <p className="text-xs font-medium text-teal-700">Read guide →</p>
      </div>
    </Link>
  )
}

export function RelatedPostsCarousel({ posts, cohort, surface = 'placements' }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [index, setIndex] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)

  const loopPosts = useMemo(() => {
    if (posts.length === 0) return []
    if (posts.length < 4) return [...posts, ...posts, ...posts]
    return [...posts, ...posts]
  }, [posts])

  useEffect(() => {
    setIndex(0)
  }, [posts])

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const goMobile = (dir: -1 | 1) => {
    setIndex((current) => (current + dir + posts.length) % posts.length)
  }

  const scrollDesktop = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const half = el.scrollWidth / 2
    el.scrollBy({ left: dir * DESKTOP_CARD_STEP_PX, behavior: 'smooth' })
    window.setTimeout(() => {
      const node = scrollerRef.current
      if (!node) return
      if (node.scrollLeft >= half) node.scrollLeft -= half
    }, 450)
  }

  useEffect(() => {
    if (posts.length <= 1) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const timer = window.setInterval(() => {
      if (paused) return

      if (isDesktop) {
        const el = scrollerRef.current
        if (!el || el.scrollWidth <= el.clientWidth) return
        const half = el.scrollWidth / 2
        el.scrollBy({ left: DESKTOP_CARD_STEP_PX, behavior: 'smooth' })
        window.setTimeout(() => {
          const node = scrollerRef.current
          if (!node) return
          if (node.scrollLeft >= half) node.scrollLeft -= half
        }, 450)
        return
      }

      setIndex((current) => (current + 1) % posts.length)
    }, AUTO_ADVANCE_MS)

    return () => window.clearInterval(timer)
  }, [paused, posts.length, isDesktop])

  if (posts.length === 0) return null

  return (
    <section
      aria-label="Related Foundation Year guides"
      className="relative mt-2 overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-br from-slate-50 via-teal-50/40 to-blue-50/50 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="flex items-center gap-3 border-b border-teal-100/90 bg-white/70 px-4 py-3 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
            Keep exploring
          </p>
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Related Foundation Year guides
          </h2>
        </div>
        {posts.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => (isDesktop ? scrollDesktop(-1) : goMobile(-1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-teal-200 bg-white text-teal-700 hover:bg-teal-50"
              aria-label="Previous related guide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => (isDesktop ? scrollDesktop(1) : goMobile(1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-teal-200 bg-white text-teal-700 hover:bg-teal-50"
              aria-label="Next related guide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile: one centered card */}
      <div className="flex justify-center px-4 py-5 sm:hidden">
        <RelatedCard
          key={posts[index].id}
          post={posts[index]}
          cohort={cohort}
          surface={surface}
          className="w-full max-w-[320px] animate-in fade-in duration-300"
        />
      </div>

      {posts.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-4 sm:hidden">
          {posts.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show related guide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-teal-600' : 'w-1.5 bg-teal-200 hover:bg-teal-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Desktop: multi-card horizontal strip */}
      <div
        ref={scrollerRef}
        className="hidden gap-4 overflow-x-auto px-4 py-5 sm:flex sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loopPosts.map((post, i) => (
          <RelatedCard
            key={`${post.id}-${i}`}
            post={post}
            cohort={cohort}
            surface={surface}
            className="w-[280px] shrink-0"
          />
        ))}
      </div>
    </section>
  )
}
