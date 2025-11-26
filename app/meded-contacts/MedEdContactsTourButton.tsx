'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useOnboardingTour } from '@/components/onboarding/OnboardingContext'
import { createCompleteMedEdContactsTour } from '@/lib/onboarding/steps/meded-contacts/CompleteMedEdContactsTour'
import { useSession } from 'next-auth/react'

export function MedEdContactsTourButton() {
  const { startTourWithSteps } = useOnboardingTour()
  const { data: session } = useSession()

  const handleStartTour = () => {
    const userRole = session?.user?.role || 'meded_team'
    const contactsSteps = createCompleteMedEdContactsTour({ 
      role: userRole as any
    })
    if (startTourWithSteps) {
      startTourWithSteps(contactsSteps)
    }
  }

  return (
    <Button
      onClick={handleStartTour}
      variant="secondary"
      className="hidden lg:flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Start MedEd Contacts Tour
    </Button>
  )
}

