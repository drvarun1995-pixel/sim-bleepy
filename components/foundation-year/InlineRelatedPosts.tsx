'use client'

import Link from 'next/link'
import { ArrowUpRight, BookMarked } from 'lucide-react'
import type { FyCohort } from '@/lib/foundation-year'
import type { RelatedFyPost } from '@/components/foundation-year/RelatedPostsCarousel'

type Props = {
  posts: RelatedFyPost[]
  cohort: FyCohort
}

/**
 * Sparse mid-article related links — max 2, compact callout.
 */
export function InlineRelatedPosts({ posts, cohort }: Props) {
  const items = posts.slice(0, 2)
  if (items.length === 0) return null

  return (
    <aside
      className="not-prose my-8 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50/70 to-slate-50 px-4 py-3.5 sm:px-5"
      aria-label="Related guides"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <BookMarked className="h-3.5 w-3.5 text-teal-700" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
          Related reading
        </p>
      </div>
      <ul className="space-y-1.5">
        {items.map((post) => (
          <li key={post.id}>
            <Link
              href={`/placements/foundation-year/${cohort}/${post.topicSlug}/${post.slug}`}
              className="group flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 text-sm text-slate-800 transition hover:bg-white/80 hover:text-teal-900"
            >
              <span className="min-w-0">
                <span className="font-medium leading-snug">{post.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{post.topicName}</span>
              </span>
              <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 opacity-60 transition group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
