'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type FyPageGridItem = {
  id: string
  href: string
  title: string
  imageUrl?: string | null
}

const INITIAL = 12
const STEP = 12

type Props = {
  items: FyPageGridItem[]
  emptyMessage?: string
}

export function FyPageGrid({
  items,
  emptyMessage = 'No guides in this topic yet.',
}: Props) {
  const [visibleCount, setVisibleCount] = useState(INITIAL)
  const shown = items.slice(0, visibleCount)
  const remaining = Math.max(0, items.length - visibleCount)

  if (!items.length) {
    return <p className="mt-8 text-sm text-slate-500">{emptyMessage}</p>
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((page) => (
          <Link
            key={page.id}
            href={page.href}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-teal-300 hover:shadow-sm"
          >
            <div className="relative aspect-[16/10] bg-slate-100">
              {page.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.imageUrl}
                  alt={`${page.title} — Foundation Year guide`}
                  width={640}
                  height={400}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                  <BookOpen className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-teal-800">
                {page.title}
              </h2>
            </div>
          </Link>
        ))}
      </div>

      {remaining > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisibleCount((c) => c + STEP)}
            className="border-teal-200 text-teal-800 hover:bg-teal-50"
          >
            Load more ({remaining} remaining)
          </Button>
        </div>
      )}
    </div>
  )
}
