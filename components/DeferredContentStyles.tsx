'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const ContentStyles = dynamic(
  () => import('@/components/ContentStyles').then((mod) => mod.ContentStyles),
  { ssr: false }
)

/**
 * Article / editor / FY CSS is not needed to paint the homepage hero.
 * Load it after idle so it is not render-blocking on `/`.
 */
export function DeferredContentStyles() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const enable = () => setReady(true)
    let idleId: number | undefined
    let timer: ReturnType<typeof setTimeout> | undefined

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(enable, { timeout: 2500 })
    } else {
      timer = setTimeout(enable, 1500)
    }

    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!ready) return null
  return <ContentStyles />
}
