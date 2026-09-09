export const TEACHING_PORTFOLIO_MAX_FILE_SIZE = 25 * 1024 * 1024
export const TEACHING_PORTFOLIO_MAX_FILES = 10

export const TEACHING_PORTFOLIO_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export const TEACHING_PORTFOLIO_ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
]

export const TEACHING_PORTFOLIO_ACCEPT = `.${TEACHING_PORTFOLIO_ALLOWED_EXTENSIONS.join(',.')}`

export function isAllowedTeachingPortfolioFile(file: { type?: string | null; name?: string | null }) {
  if (file.type && TEACHING_PORTFOLIO_ALLOWED_TYPES.includes(file.type)) return true
  const ext = (file.name || '').split('.').pop()?.toLowerCase()
  return !!ext && TEACHING_PORTFOLIO_ALLOWED_EXTENSIONS.includes(ext)
}

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

export type TeachingPortfolioEvidence = {
  id: string
  entry_id: string
  filename: string
  original_filename: string | null
  file_size: number | null
  file_type: string | null
  mime_type: string | null
  file_path: string
  created_at: string
}

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
  evidence?: TeachingPortfolioEvidence[]
}

export function entryEvidenceFiles(entry: TeachingPortfolioEntry): TeachingPortfolioEvidence[] {
  if (entry.evidence && entry.evidence.length > 0) return entry.evidence
  if (entry.file_path) {
    return [
      {
        id: entry.id,
        entry_id: entry.id,
        filename: entry.filename || 'evidence',
        original_filename: entry.original_filename,
        file_size: entry.file_size,
        mime_type: entry.mime_type,
        file_type: entry.file_type,
        file_path: entry.file_path,
        created_at: entry.created_at,
      },
    ]
  }
  return []
}

export function entryHasEvidence(entry: TeachingPortfolioEntry): boolean {
  return entryEvidenceFiles(entry).length > 0
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

export function evidenceZipFilename(
  entry: TeachingPortfolioEntry,
  file?: Pick<TeachingPortfolioEvidence, 'original_filename' | 'file_type'> | null
): string {
  const date = (entry.activity_date || '').slice(0, 10) || 'undated'
  const title = sanitizeZipPart(teachingEntryTitle(entry)).slice(0, 60)
  const original = sanitizeZipPart(file?.original_filename || entry.original_filename || 'evidence')
  const ext = (
    file?.file_type ||
    entry.file_type ||
    original.split('.').pop() ||
    'bin'
  ).replace(/^\./, '')
  const base = original.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
    ? original.slice(0, -(ext.length + 1))
    : original
  return `${date}_${title}_${base}.${ext}`
}
