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
    // Return a default object during SSR or when provider is not available
    // This prevents build errors during static generation
    return {
      startTour: () => {},
      startTourWithSteps: () => {},
      skipTour: () => {},
    }
  }
  return context
}
