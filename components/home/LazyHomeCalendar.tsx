'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const Calendar = dynamic(() => import('@/components/Calendar'), {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto min-h-[420px] w-full max-w-4xl rounded-2xl border border-white/5 bg-white/[0.02]"
      aria-hidden
    />
  ),
})

type LazyHomeCalendarProps = {
  showEventsList?: boolean
  maxEventsToShow?: number
  clickableEvents?: boolean
  showEventDetails?: boolean
  centerContent?: boolean
}

/**
 * Mount the homepage calendar only when #calendar nears the viewport
 * so its JS/DOM stay off the critical path.
 */
export function LazyHomeCalendar(props: LazyHomeCalendarProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    const node = rootRef.current
    if (!node || shouldMount) return

    // Deep-link / in-page jump to #calendar should mount immediately.
    if (typeof window !== 'undefined' && window.location.hash === '#calendar') {
      setShouldMount(true)
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setShouldMount(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMount(true)
          observer.disconnect()
        }
      },
      { rootMargin: '280px 0px', threshold: 0.01 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [shouldMount])

  return (
    <div ref={rootRef}>
      {shouldMount ? (
        <Calendar {...props} />
      ) : (
        <div
          className="mx-auto min-h-[420px] w-full max-w-4xl rounded-2xl border border-white/5 bg-white/[0.02]"
          aria-hidden
        />
      )}
    </div>
  )
}
