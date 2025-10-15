'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { pageview } from '@/lib/gtag'

export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      // Track page view with specific page name
      const pageTitle = document.title || pathname
      pageview(pathname, pageTitle)
    }
  }, [pathname])

  return null // This component doesn't render anything
}
