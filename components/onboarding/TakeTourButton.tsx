'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useOnboardingTour } from './OnboardingContext'

export function TakeTourButton() {
  const { startTour } = useOnboardingTour()

  return (
    <div className="mb-6">
      <Button
        onClick={() => startTour(false)} // false = do loading check
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
