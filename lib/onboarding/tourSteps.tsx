import React from 'react'
import { Step } from 'react-joyride'
import { createCompleteDashboardTour } from './steps'

export interface TourStepsByRole {
  student: Step[]
  educator: Step[]
  meded_team: Step[]
  ctf: Step[]
}

export const tourSteps: TourStepsByRole = {
  // Example: Student full tour - Phase 1 (Complete Dashboard Tour)
  // student: [
  //   ...createCompleteDashboardTour({ role: 'student' }),
  //   // ... Phase 2+ steps (Calendar, Events, etc.)
  // ],
  student: [],
  
  // Example: Educator full tour - Phase 1 (Complete Dashboard Tour)
  // educator: [
  //   ...createCompleteDashboardTour({ role: 'educator' }),
  //   // ... Phase 2+ steps (Calendar, Events, etc.)
  // ],
  educator: [],
  
  meded_team: [
    // Phase 1: Complete Dashboard Tour (Reusable for all roles)
    // Includes: Welcome + Navigation + Dashboard Overview + All Widgets (12 steps total)
    ...createCompleteDashboardTour({ role: 'meded_team' }),
    // Phase 2+ steps will be added here (Calendar, Events, Event Data, etc.)
  ],
  
  // Example: CTF full tour - Phase 1 (Complete Dashboard Tour)
  // ctf: [
  //   ...createCompleteDashboardTour({ role: 'ctf' }),
  //   // ... Phase 2+ steps
  // ],
  ctf: [],
}
