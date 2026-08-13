export type RegistrationSource = 'self' | 'walk_in_scan' | 'walk_in_guest' | 'admin'

export const WALK_IN_DESIGNATION_OPTIONS = [
  { value: 'medical_student', label: 'Medical Student' },
  { value: 'foundation_doctor', label: 'Foundation Year Doctor' },
  { value: 'clinical_fellow', label: 'Clinical Fellow' },
  { value: 'clinical_teaching_fellow', label: 'Clinical Teaching Fellow' },
  { value: 'specialty_doctor', label: 'Specialty Doctor' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'other', label: 'Other' },
] as const

export function registrationSourceLabel(source?: string | null): string {
  switch (source) {
    case 'walk_in_scan':
      return 'Walk-in (signed in)'
    case 'walk_in_guest':
      return 'Walk-in (guest)'
    case 'admin':
      return 'Added by staff'
    case 'self':
    default:
      return 'Registered'
  }
}

export function registrationSourceBadgeClass(source?: string | null): string {
  switch (source) {
    case 'walk_in_scan':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'walk_in_guest':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'self':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}
