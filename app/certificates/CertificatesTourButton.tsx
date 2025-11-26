'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useOnboardingTour } from '@/components/onboarding/OnboardingContext'
import { createCompleteCertificatesTour } from '@/lib/onboarding/steps/certificates/CompleteCertificatesTour'
import { useSession } from 'next-auth/react'

export function CertificatesTourButton() {
  const { data: session } = useSession()
  const { startTourWithSteps } = useOnboardingTour()

  return (
    <Button
      onClick={() => {
        const userRole = session?.user?.role || 'meded_team'
        const certificatesSteps = createCompleteCertificatesTour({ 
          role: userRole as any
        })
        if (startTourWithSteps) {
          startTourWithSteps(certificatesSteps)
        }
      }}
      variant="secondary"
      className="hidden lg:flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900"
    >
      <Sparkles className="h-4 w-4" />
      Start Certificates Tour
    </Button>
  )
}

