'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useOnboardingTour } from '@/components/onboarding/OnboardingContext'
import { createCompleteStudentCohortsTour } from '@/lib/onboarding/steps/cohorts/CompleteStudentCohortsTour'
import { useSession } from 'next-auth/react'

export function StudentCohortsTourButton() {
  const { startTourWithSteps } = useOnboardingTour()
  const { data: session } = useSession()

  const handleStartTour = () => {
    const userRole = session?.user?.role || 'admin' // Default role for cohorts
    const cohortsSteps = createCompleteStudentCohortsTour({
      role: userRole as any
    })
    if (startTourWithSteps) {
      startTourWithSteps(cohortsSteps)
    }
  }

  return (
    <Button
      onClick={handleStartTour}
      variant="secondary"
      className="hidden lg:flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Start Student Cohorts Tour
    </Button>
  )
}

