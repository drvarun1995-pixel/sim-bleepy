'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, FolderOpen, ThumbsDown, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { FyCohort } from '@/lib/foundation-year'
import type { RelatedFyPost } from '@/components/foundation-year/RelatedPostsCarousel'

type Props = {
  pageId: string
  cohort: FyCohort
  topicSlug: string
  topicName: string
  nextPost: RelatedFyPost | null
  /** Public guides cannot submit authenticated feedback — hide that block. */
  surface?: 'placements' | 'public'
}

function storageKey(pageId: string) {
  return `fy-feedback:${pageId}`
}

export function ArticleAfterword({
  pageId,
  cohort,
  topicSlug,
  topicName,
  nextPost,
  surface = 'placements',
}: Props) {
  const router = useRouter()
  const isPublic = surface === 'public'
  const [helpful, setHelpful] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showComment, setShowComment] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey(pageId))
      if (stored === 'yes' || stored === 'no') {
        setSubmitted(true)
        setHelpful(stored === 'yes')
      } else {
        setSubmitted(false)
        setHelpful(null)
        setComment('')
        setShowComment(false)
      }
    } catch {
      setSubmitted(false)
    }
  }, [pageId])

  const topicHref = isPublic
    ? `/guides/foundation-year/${topicSlug}`
    : `/placements/foundation-year/${cohort}/${topicSlug}`
  const nextHref = nextPost
    ? isPublic
      ? `/guides/foundation-year/${nextPost.topicSlug}/${nextPost.slug}`
      : `/placements/foundation-year/${cohort}/${nextPost.topicSlug}/${nextPost.slug}`
    : null

  // Prefetch next recommended guide (and topic hub) during idle time.
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection
    if (connection?.saveData) return

    const targets = [nextHref, topicHref].filter(Boolean) as string[]
    if (!targets.length) return

    const prefetch = () => {
      for (const href of targets) {
        try {
          router.prefetch(href)
        } catch {
          // ignore
        }
      }
    }

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(prefetch, { timeout: 2500 })
      return () => win.cancelIdleCallback?.(id)
    }
    const timer = window.setTimeout(prefetch, 2000)
    return () => window.clearTimeout(timer)
  }, [nextHref, topicHref, router])

  const saveFeedback = async (value: boolean) => {
    try {
      setSubmitting(true)
      const res = await fetch('/api/placements/foundation-year/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          helpful: value,
          comment: comment.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send feedback')
      }

      try {
        localStorage.setItem(storageKey(pageId), value ? 'yes' : 'no')
      } catch {
        // ignore
      }
      setHelpful(value)
      setSubmitted(true)
      setShowComment(false)
      toast.success('Thanks for your feedback')
    } catch (err: any) {
      toast.error(err.message || 'Could not save feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const onYes = () => saveFeedback(true)
  const onNo = () => {
    setHelpful(false)
    setShowComment(true)
  }

  return (
    <div className="space-y-3">
      {/* Helpfulness — members only (feedback API requires sign-in) */}
      {!isPublic && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
          {submitted ? (
            <p className="text-sm text-slate-600">
              Thanks — your feedback helps improve these guides.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-800">Was this guide helpful?</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={onYes}
                    className="gap-1.5 border-teal-200 text-teal-800 hover:bg-teal-50"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={onNo}
                    className="gap-1.5"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    No
                  </Button>
                </div>
              </div>

              {showComment && (
                <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                  <label className="block text-xs font-medium text-slate-600">
                    What could be better? (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Tell us what was missing or unclear…"
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={submitting}
                      onClick={() => saveFeedback(false)}
                    >
                      Skip
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={submitting}
                      onClick={() => saveFeedback(false)}
                      className="bg-teal-700 hover:bg-teal-800"
                    >
                      Send feedback
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Next guide + topic hub */}
      <div className="grid gap-3 sm:grid-cols-2">
        {nextHref && nextPost ? (
          <Link
            href={nextHref}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white px-4 py-4 transition hover:border-teal-300 hover:shadow-sm sm:px-5"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                Next recommended
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900 group-hover:text-teal-900">
                {nextPost.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{nextPost.topicName}</p>
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm transition group-hover:bg-teal-700">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Next recommended
            </p>
            <p className="mt-1 text-sm text-slate-600">
              You’re at the end of this topic — browse more guides below.
            </p>
          </div>
        )}

        <Link
          href={topicHref}
          className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-sm sm:px-5"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Topic hub
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 group-hover:text-teal-900">
              More in {topicName}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">See all guides in this topic</p>
          </div>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-teal-100 group-hover:text-teal-800">
            <FolderOpen className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  )
}
