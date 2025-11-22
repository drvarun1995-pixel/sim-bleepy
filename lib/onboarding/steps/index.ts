/**
 * Reusable Tour Steps
 * 
 * This file exports all reusable step definitions that can be used
 * across different roles, devices, and tour types.
 */

export { createDashboardStep, dashboardStep, type DashboardStepConfig } from './dashboard/DashboardStep'
export { 
  createDashboardWidgetSteps, 
  createFullDashboardTour,
  type DashboardWidgetStepsConfig 
} from './dashboard/DashboardWidgetSteps'
export { 
  createCompleteDashboardTour,
  type CompleteDashboardTourConfig 
} from './dashboard/CompleteDashboardTour'
export { 
  createCompleteCalendarTour,
  type CompleteCalendarTourConfig 
} from './calendar/CompleteCalendarTour'
export { 
  createCompleteEventsListTour,
  type CompleteEventsListTourConfig 
} from './events-list/CompleteEventsListTour'
export { 
  createCompleteFormatsTour,
  type CompleteFormatsTourConfig 
} from './formats/CompleteFormatsTour'
export { 
  createCompleteMyBookingsTour,
  type CompleteMyBookingsTourConfig 
} from './my-bookings/CompleteMyBookingsTour'
export { 
  createCompleteMyAttendanceTour,
  type CompleteMyAttendanceTourConfig 
} from './my-attendance/CompleteMyAttendanceTour'
export { 
  createCompleteMyCertificatesTour,
  type CompleteMyCertificatesTourConfig 
} from './my-certificates/CompleteMyCertificatesTour'
export { 
  createCompleteEventDataTour,
  type CompleteEventDataTourConfig 
} from './event-data/CompleteEventDataTour'

