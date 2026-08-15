'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const EmailStorage = dynamic(
  () => import('@/components/EmailStorage').then((mod) => mod.EmailStorage),
  { ssr: false }
)

const UserActivityTracker = dynamic(
  () => import('@/components/UserActivityTracker').then((mod) => mod.UserActivityTracker),
  { ssr: false }
)

const PerformanceMonitor = dynamic(
  () => import('@/components/PerformanceMonitor').then((mod) => mod.PerformanceMonitor),
  { ssr: false }
)

/**
 * Session-only trackers and the perf logger are not needed for first paint.
 */
export function DeferredAppChrome() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const enable = () => setReady(true)
    let idleId: number | undefined
    let timer: ReturnType<typeof setTimeout> | undefined

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(enable, { timeout: 3000 })
    } else {
      timer = setTimeout(enable, 2000)
    }

    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!ready) return null

  return (
    <>
      <EmailStorage />
      <UserActivityTracker />
      <PerformanceMonitor />
    </>
  )
}
