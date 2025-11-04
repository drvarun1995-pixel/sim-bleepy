'use client'

import { createContext, useContext } from 'react'

interface OnboardingContextType {
  startTour: (skipLoadingCheck?: boolean) => void
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
