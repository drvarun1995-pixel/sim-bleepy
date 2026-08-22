'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { GA_MEASUREMENT_ID, isGAEnabled } from '@/lib/gtag'

const EXCLUDED_EMAILS = [
  'drvarun1995@gmail.com',
  'varun.tyagi@nhs.net',
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map((email) => email.trim()) || []),
]

function canLoadAnalytics(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const userEmail = localStorage.getItem('userEmail')
    if (userEmail && EXCLUDED_EMAILS.includes(userEmail)) return false

    const sessionEmail = sessionStorage.getItem('userEmail')
    if (sessionEmail && EXCLUDED_EMAILS.includes(sessionEmail)) return false

    if (EXCLUDED_EMAILS.some((email) => window.location.href.includes(email))) return false

    if (localStorage.getItem('cookie-consent-given') !== 'true') return false

    const raw = localStorage.getItem('cookie-preferences')
    if (!raw) return false

    const preferences = JSON.parse(raw) as { analytics?: boolean }
    return preferences.analytics === true
  } catch {
    return false
  }
}

/**
 * Only download/execute gtag after analytics consent.
 * Avoids ~160KB unused JS on first paint for new visitors.
 */
export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!isGAEnabled) return

    const sync = () => setEnabled(canLoadAnalytics())
    sync()

    window.addEventListener('bleepy-cookie-consent', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('bleepy-cookie-consent', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (!isGAEnabled || !enabled || !GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            function getPageTitle(pathname) {
              var pageTitles = {
                '/': 'Home',
                '/dashboard': 'Dashboard',
                '/analytics': 'Analytics Dashboard',
                '/download-analytics': 'Download Analytics',
                '/admin-dashboard': 'Admin Dashboard',
                '/auth/signin': 'Sign In',
                '/auth/signup': 'Sign Up',
                '/profile': 'User Profile',
                '/getting-started': 'Getting Started',
                '/cookies': 'Cookie Policy',
                '/terms': 'Terms of Service'
              };
              return pageTitles[pathname] || document.title;
            }

            var specificPageTitle = getPageTitle(window.location.pathname);
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              page_title: specificPageTitle,
              page_location: window.location.href,
              send_page_view: true,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure',
              cookie_domain: 'auto',
              cookie_expires: 63072000
            });
          `,
        }}
      />
    </>
  )
}
