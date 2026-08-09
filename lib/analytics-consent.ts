/**
 * Client-side analytics consent check (cookie banner preferences).
 * Matches the pattern used by downloads / UserActivityTracker / GoogleAnalytics.
 */
export function hasAnalyticsCookieConsent(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const consentGiven = localStorage.getItem('cookie-consent-given')
    if (!consentGiven) return false

    const raw = localStorage.getItem('cookie-preferences')
    if (!raw) return false

    const preferences = JSON.parse(raw) as { analytics?: boolean }
    return preferences.analytics === true
  } catch {
    return false
  }
}
