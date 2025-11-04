'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useOnboardingTour } from './OnboardingContext'

interface OnboardingCheckProps {
  userRole?: string | null
}

export function OnboardingCheck({ userRole }: OnboardingCheckProps) {
  const { data: session } = useSession()
  const { startTour } = useOnboardingTour()
  const [checked, setChecked] = useState(false)

  // Check if device is desktop (not mobile or tablet)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  useEffect(() => {
    if (!session?.user || checked) return
    
    // Only auto-start for meded_team role for now
    if (userRole !== 'meded_team') {
      setChecked(true)
      return
    }

    // Only run on desktop devices
    if (!isDesktop) {
      setChecked(true)
      return
    }

    const checkAndStartTour = async () => {
      try {
        const response = await fetch('/api/onboarding/status')
        const data = await response.json()

        // Auto-start tour if not completed, not skipped, and not set to never show
        // Skip loading check for auto-start - just show first popup (step 0)
        // Loading check will happen when user clicks "Start Tour" button
        if (!data.completed && !data.skipped && !data.neverShow) {
          // Start tour without loading check - just show welcome popup (step 0)
          setTimeout(() => {
            startTour(true) // true = skip loading check
          }, 500) // Small delay just to ensure DOM is ready
        }

        setChecked(true)
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setChecked(true)
      }
    }

    checkAndStartTour()
  }, [session, userRole, checked, startTour])

  return null // This component doesn't render anything
}
