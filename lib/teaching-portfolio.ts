export const TEACHING_PORTFOLIO_MAX_FILE_SIZE = 25 * 1024 * 1024

export const TEACHING_PORTFOLIO_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

export const TAUGHT_TO_OPTIONS = [
  { value: 'medical_students', label: 'Medical students' },
  { value: 'foundation_year', label: 'Foundation year' },
  { value: 'postgraduates', label: 'Postgraduates' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'other', label: 'Other' },
] as const

export const LEARNING_TYPE_OPTIONS = [
  { value: 'course', label: 'Course' },
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'e-learning', label: 'E-learning' },
  { value: 'other', label: 'Other' },
] as const

export type TeachingEntryKind = 'taught' | 'learnt'

export type TeachingPortfolioEntry = {
  id: string
  filename: string | null
  original_filename: string | null
  display_name: string | null
  file_size: number | null
  file_type: string | null
  mime_type: string | null
  category: string | null
  evidence_type: string | null
  file_path: string | null
  description: string | null
  activity_date: string | null
  created_at: string
  updated_at: string
  entry_kind?: TeachingEntryKind | null
  session_title?: string | null
  session_time?: string | null
  taught_to?: string | null
  learning_type?: string | null
  provider?: string | null
}

export function teachingEntryKind(entry: Pick<TeachingPortfolioEntry, 'entry_kind'>): TeachingEntryKind {
  return entry.entry_kind === 'learnt' ? 'learnt' : 'taught'
}

export function teachingEntryTitle(entry: Pick<TeachingPortfolioEntry, 'session_title' | 'display_name' | 'original_filename'>): string {
  return (entry.session_title || entry.display_name || entry.original_filename || 'Untitled').trim()
}

export function teachingOptionLabel(
  options: readonly { value: string; label: string }[],
  value?: string | null
): string {
  if (!value) return ''
  return options.find((opt) => opt.value === value)?.label || value.replace(/_/g, ' ')
}

export function sanitizeZipPart(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim() || 'untitled'
}

export function evidenceZipFilename(entry: TeachingPortfolioEntry): string {
  const date = (entry.activity_date || '').slice(0, 10) || 'undated'
  const title = sanitizeZipPart(teachingEntryTitle(entry)).slice(0, 80)
  const ext = (entry.file_type || entry.original_filename?.split('.').pop() || 'bin').replace(/^\./, '')
  return `${date}_${title}.${ext}`
}
