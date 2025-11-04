'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useOnboardingTour } from './OnboardingContext'
import { useRouter, usePathname } from 'next/navigation'

export function TakeTourButton() {
  const { startTour } = useOnboardingTour()
  const router = useRouter()
  const pathname = usePathname()

  const handleTakeTour = () => {
    // Check if we're on a profile page
    const isProfilePage = pathname?.includes('/profile')
    
    if (isProfilePage) {
      // Set a flag with timestamp in sessionStorage to start tour after navigation
      // Using timestamp ensures it only works on navigation, not page refresh
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('startTourAfterNavigation', Date.now().toString())
      }
      // Navigate to dashboard
      router.push('/dashboard')
    } else {
      // Already on dashboard or other page, start tour directly
      startTour(false) // false = do loading check
    }
  }

  return (
    <div className="mb-6">
      <Button
        onClick={handleTakeTour}
        variant="outline"
        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Take a Tour
      </Button>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        Explore the platform features with our interactive onboarding tour
      </p>
    </div>
  )
}
