'use client'

import { useEffect, useRef } from 'react'
import { hasAnalyticsCookieConsent } from '@/lib/analytics-consent'

type Props = {
  pageId: string
  pageSlug: string
  pageTitle: string
  contentSelector?: string
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `fy_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function postTrack(payload: Record<string, unknown>, keepalive = false) {
  // Respect cookie / analytics policy — never track without consent
  if (!hasAnalyticsCookieConsent()) return

  try {
    await fetch('/api/blog-analytics/track', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive,
    })
  } catch {
    // Non-blocking analytics
  }
}

export function FyBlogTracker({
  pageId,
  pageSlug,
  pageTitle,
  contentSelector = '.fy-article-content',
}: Props) {
  const sessionIdRef = useRef(createSessionId())
  const activeMsRef = useRef(0)
  const lastTickRef = useRef(Date.now())
  const maxScrollRef = useRef(0)
  const visibleRef = useRef(true)
  const metaRef = useRef({ pageId, pageSlug, pageTitle })

  useEffect(() => {
    metaRef.current = { pageId, pageSlug, pageTitle }
  }, [pageId, pageSlug, pageTitle])

  useEffect(() => {
    // Do not attach listeners or start a session without analytics consent
    if (!hasAnalyticsCookieConsent()) return

    sessionIdRef.current = createSessionId()
    activeMsRef.current = 0
    lastTickRef.current = Date.now()
    maxScrollRef.current = 0

    const flush = (action: 'heartbeat' | 'end', keepalive = false) => {
      const meta = metaRef.current
      void postTrack(
        {
          action,
          sessionId: sessionIdRef.current,
          pageId: meta.pageId,
          pageSlug: meta.pageSlug,
          pageTitle: meta.pageTitle,
          activeSeconds: Math.round(activeMsRef.current / 1000),
          maxScrollPercent: maxScrollRef.current,
        },
        keepalive
      )
    }

    const trackEvent = (
      eventType: 'click' | 'download' | 'outbound' | 'image',
      label: string,
      href = ''
    ) => {
      const meta = metaRef.current
      void postTrack({
        action: 'event',
        sessionId: sessionIdRef.current,
        pageId: meta.pageId,
        pageSlug: meta.pageSlug,
        pageTitle: meta.pageTitle,
        activeSeconds: Math.round(activeMsRef.current / 1000),
        maxScrollPercent: maxScrollRef.current,
        eventType,
        eventLabel: label,
        eventHref: href,
      })
    }

    void postTrack({
      action: 'start',
      sessionId: sessionIdRef.current,
      pageId,
      pageSlug,
      pageTitle,
      activeSeconds: 0,
      maxScrollPercent: 0,
    })

    const tick = () => {
      const now = Date.now()
      if (visibleRef.current && document.visibilityState === 'visible') {
        activeMsRef.current += now - lastTickRef.current
      }
      lastTickRef.current = now
    }

    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) {
        maxScrollRef.current = 100
        return
      }
      const pct = Math.round((window.scrollY / scrollable) * 100)
      maxScrollRef.current = Math.max(maxScrollRef.current, Math.min(100, pct))
    }

    const onVisibility = () => {
      tick()
      visibleRef.current = document.visibilityState === 'visible'
      if (!visibleRef.current) flush('heartbeat', true)
    }

    const heartbeat = window.setInterval(() => {
      tick()
      flush('heartbeat')
    }, 15000)

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const root = document.querySelector(contentSelector)
      if (!root || !root.contains(target)) return

      const anchor = target.closest('a') as HTMLAnchorElement | null
      if (anchor?.href) {
        const href = anchor.href
        const label = (anchor.textContent || href).trim().slice(0, 200)
        const isDownload =
          anchor.hasAttribute('download') ||
          /\.(pdf|docx?|xlsx?|pptx?|zip)(\?|$)/i.test(href)
        let isOutbound = false
        try {
          isOutbound = new URL(href).origin !== window.location.origin
        } catch {
          isOutbound = false
        }
        if (isDownload) trackEvent('download', label, href)
        else if (isOutbound) trackEvent('outbound', label, href)
        else trackEvent('click', label, href)
        return
      }

      const img = target.closest('img') as HTMLImageElement | null
      if (img?.src) {
        trackEvent('image', img.alt || 'image', img.src)
      }
    }

    const onPageHide = () => {
      tick()
      flush('end', true)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('click', onClick, true)
    window.addEventListener('pagehide', onPageHide)
    onScroll()

    return () => {
      window.clearInterval(heartbeat)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('pagehide', onPageHide)
      tick()
      flush('end', true)
    }
  }, [pageId, pageSlug, pageTitle, contentSelector])

  return null
}
