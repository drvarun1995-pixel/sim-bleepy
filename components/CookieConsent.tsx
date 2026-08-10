'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Cookie, Settings, Shield, Eye, CheckCircle } from 'lucide-react'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

function notifyConsent(prefs: CookiePreferences) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('bleepy-cookie-consent', { detail: prefs }))
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    marketing: false,
  })

  useEffect(() => {
    const consentGiven = localStorage.getItem('cookie-consent-given')
    if (consentGiven) return

    // Always wait ~2.8s so the hero can become LCP before this banner paints.
    const timer = window.setTimeout(() => setIsVisible(true), 2800)
    return () => window.clearTimeout(timer)
  }, [])

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    }
    savePreferences(allAccepted)
    setIsVisible(false)
  }

  const handleRejectAll = () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      marketing: false,
    }
    savePreferences(onlyEssential)
    setIsVisible(false)
  }

  const handleSavePreferences = () => {
    savePreferences(preferences)
    setShowSettings(false)
    setIsVisible(false)
  }

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent-given', 'true')
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs))
    localStorage.setItem('cookie-consent-timestamp', new Date().toISOString())
    notifyConsent(prefs)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4">
        {!showSettings ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Cookie className="h-4 w-4 text-blue-600" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                  We use cookies to enhance your experience
                </h3>
                <p className="mt-1 text-xs leading-snug text-gray-600 sm:text-sm">
                  Essential cookies keep the site working. Optional analytics help us improve it.
                  See our{' '}
                  <a href="/cookies" className="font-medium text-blue-700 underline">
                    Cookie Policy
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="font-medium text-blue-700 underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="inline-flex items-center gap-1.5"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="inline-flex items-center gap-1.5"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Cookie Preferences</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)} aria-label="Close settings">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <Shield className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900">Essential Cookies</h4>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-800">
                      Always Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Required for authentication, security, and basic site functionality.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Eye className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900">Analytics Cookies</h4>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-600">
                    Helps us understand site usage. Not used for advertising.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <Cookie className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900">Marketing Cookies</h4>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-600">
                    Used to show more relevant ads across websites.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 sm:flex-row">
              <Button variant="outline" onClick={handleRejectAll} className="inline-flex items-center gap-1.5">
                <X className="h-4 w-4" aria-hidden="true" />
                Reject All
              </Button>
              <Button
                onClick={handleSavePreferences}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
