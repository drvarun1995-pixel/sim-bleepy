'use client'

import { createContext, useContext } from 'react'
import type { Step } from 'react-joyride'

interface OnboardingContextType {
  startTour: (skipLoadingCheck?: boolean) => void
  startTourWithSteps: (customSteps: Step[], skipLoadingCheck?: boolean) => void
  skipTour: () => void
}

export const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function useOnboardingTour() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboardingTour must be used within OnboardingTourProvider')
  }
  return context
}
