'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const BleepyThreeScene = dynamic(
  () => import('@/components/home/BleepyThreeScene').then((mod) => mod.BleepyThreeScene),
  { ssr: false }
)

/**
 * Load the WebGL hero only after first paint / idle so it does not compete with LCP/FCP.
 */
export function DeferredBleepyThreeScene() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let idleId: number | undefined
    let timer: ReturnType<typeof setTimeout> | undefined

    const enable = () => {
      if (!cancelled) setReady(true)
    }

    // Prefer idle; fall back to a short delay so mobile still gets the scene.
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(enable, { timeout: 2800 })
    } else {
      timer = setTimeout(enable, 1800)
    }

    // Absolute fallback if idle never fires under load.
    const hard = setTimeout(enable, 3200)

    return () => {
      cancelled = true
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timer) clearTimeout(timer)
      clearTimeout(hard)
    }
  }, [])

  if (!ready) return null
  return <BleepyThreeScene />
}
