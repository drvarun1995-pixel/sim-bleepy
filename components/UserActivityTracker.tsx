'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function UserActivityTracker() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
              // Check if user has consented to analytics tracking
              const checkConsent = () => {
                // Check if user has given consent at all
                const cookieConsentGiven = localStorage.getItem('cookie-consent-given')
                if (!cookieConsentGiven) {
                  console.log('No consent given - skipping login tracking')
                  return false
                }
                
                // Check analytics preference
                const cookiePreferences = localStorage.getItem('cookie-preferences')
                if (cookiePreferences) {
                  try {
                    const preferences = JSON.parse(cookiePreferences)
                    if (preferences.analytics === false) {
                      console.log('User opted out of analytics - skipping login tracking')
                      return false
                    }
                  } catch (e) {
                    console.log('Invalid preferences data - skipping login tracking')
                    return false
                  }
                } else {
                  console.log('No preferences found - skipping login tracking')
                  return false
                }
                
                return true
              }

      if (checkConsent()) {
        // Track user login only if consent is given
        fetch('/api/analytics/user-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(error => {
          console.error('Failed to track user login:', error)
        })
      }
    }
  }, [session, status])

  return null // This component doesn't render anything
}
