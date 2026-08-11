'use client'

import { NavigationGuardProvider as Provider } from 'next-navigation-guard'

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>
}
