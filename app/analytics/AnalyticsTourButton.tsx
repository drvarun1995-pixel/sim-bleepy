'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useOnboardingTour } from '@/components/onboarding/OnboardingContext'
import { createCompleteAnalyticsTour } from '@/lib/onboarding/steps/analytics/CompleteAnalyticsTour'
import { useSession } from 'next-auth/react'

export function AnalyticsTourButton() {
  const { startTourWithSteps } = useOnboardingTour()
  const { data: session } = useSession()

  const handleStartTour = () => {
    const userRole = session?.user?.role || 'admin'
    const analyticsSteps = createCompleteAnalyticsTour({ 
      role: userRole as any
    })
    if (startTourWithSteps) {
      startTourWithSteps(analyticsSteps)
    }
  }

  return (
    <Button
      onClick={handleStartTour}
      variant="secondary"
      className="hidden lg:flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Start Analytics Tour
    </Button>
  )
}

