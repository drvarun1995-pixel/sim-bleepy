'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useOnboardingTour } from './OnboardingContext'

interface OnboardingCheckProps {
  userRole?: string | null
}

export function OnboardingCheck({ userRole }: OnboardingCheckProps) {
  const { data: session } = useSession()
  const { startTour } = useOnboardingTour()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  // Check if device is desktop (not mobile or tablet)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  // Reset checked state when pathname changes to dashboard (for manual tour trigger)
  useEffect(() => {
    if (pathname?.includes('/dashboard') && typeof window !== 'undefined') {
      const hasTourFlag = sessionStorage.getItem('startTourAfterNavigation')
      if (hasTourFlag) {
        // Reset checked state to allow check to run again for manual trigger
        setChecked(false)
      }
    }
  }, [pathname])

  useEffect(() => {
    if (!session?.user || checked) return

    const checkAndStartTour = async () => {
      // Check if tour should start after navigation (from profile page - manual trigger)
      // Only process if we're on the dashboard page
      if (typeof window !== 'undefined' && pathname?.includes('/dashboard')) {
        const tourTimestamp = sessionStorage.getItem('startTourAfterNavigation')
        
        if (tourTimestamp) {
          const timestamp = parseInt(tourTimestamp, 10)
          const now = Date.now()
          const timeDiff = now - timestamp
          
          // Only process if timestamp is recent (within 10 seconds) - indicates navigation, not refresh
          // Increased from 3s to 10s to account for dashboard loading time
          if (!isNaN(timestamp) && timeDiff > 0 && timeDiff < 10000) {
            // Clear the flag immediately to prevent multiple triggers
            sessionStorage.removeItem('startTourAfterNavigation')
            
            console.log('Manual tour trigger detected on dashboard - starting tour after page loads')
            
            // Wait for dashboard to fully render, then start tour
            // Increased delay to ensure dashboard elements are loaded
            setTimeout(() => {
              console.log('Starting tour from manual trigger')
              startTour(false) // false = do loading check
            }, 1500) // Increased from 800ms to 1500ms for dashboard to fully load
            
            setChecked(true)
            return
          } else {
            // Timestamp is old or invalid - clear it (likely from a page refresh)
            if (tourTimestamp) {
              sessionStorage.removeItem('startTourAfterNavigation')
            }
          }
        }
      }

      // Auto-start logic: Only for meded_team role, on desktop, and if never_show is false
      if (userRole !== 'meded_team' || !isDesktop) {
        setChecked(true)
        return
      }

      try {
        const response = await fetch('/api/onboarding/status')
        
        if (!response.ok) {
          setChecked(true)
          return
        }
        
        const data = await response.json()

        // Don't auto-start if user has completed or set never_show
        if (data.completed === true || data.neverShow === true) {
          setChecked(true)
          return
        }

        // Auto-start tour - show first popup (step 0)
        setTimeout(() => {
          startTour(true) // true = skip loading check for auto-start
        }, 500)

        setChecked(true)
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setChecked(true)
      }
    }

    checkAndStartTour()
  }, [session, userRole, checked, startTour, isDesktop, pathname])

  return null
}
