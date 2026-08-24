import { ukZoneName } from '@/lib/ukEventTime'

export const WORK_TYPES = [
  { value: 'research', label: 'Research' },
  { value: 'audit', label: 'Audit' },
  { value: 'qi', label: 'QI' },
  { value: 'case_report', label: 'Case report' },
  { value: 'education', label: 'Education' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
] as const

export const CAREER_LEVELS = [
  { value: 'medical_student', label: 'Medical student' },
  { value: 'foundation_doctor', label: 'Foundation doctor' },
  { value: 'resident_doctor', label: 'Resident doctor' },
  { value: 'anyone', label: 'Anyone' },
] as const

export const FORMATS = [
  { value: 'in_person', label: 'In person' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hybrid', label: 'Hybrid' },
] as const

export const NATIONS = [
  { value: 'uk_wide', label: 'UK-wide' },
  { value: 'england', label: 'England' },
  { value: 'scotland', label: 'Scotland' },
  { value: 'wales', label: 'Wales' },
  { value: 'ni', label: 'Northern Ireland' },
  { value: 'international', label: 'International' },
] as const

export const RECOGNITION_LEVELS = [
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Regional' },
  { value: 'national', label: 'National' },
  { value: 'international', label: 'International' },
] as const

export const PUBLICATION_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
  { value: 'rejected', label: 'Rejected' },
] as const

export const WORKFLOW_STATUSES = [
  { value: 'saved', label: 'Saved' },
  { value: 'planning', label: 'Planning to submit' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'presented', label: 'Presented' },
] as const

export type WorkType = (typeof WORK_TYPES)[number]['value']
export type CareerLevel = (typeof CAREER_LEVELS)[number]['value']
export type ConferenceFormat = (typeof FORMATS)[number]['value']
export type Nation = (typeof NATIONS)[number]['value']
export type RecognitionLevel = (typeof RECOGNITION_LEVELS)[number]['value']
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number]['value']
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number]['value']
export type ListingStatus = 'open' | 'upcoming' | 'closed' | 'archived'

export type ConferenceSpecialty = {
  id: string
  name: string
  slug: string
}

export type ConferenceSave = {
  id: string
  workflow_status: WorkflowStatus
  notes: string | null
}

export type ConferenceOpportunity = {
  id: string
  name: string
  slug: string
  organising_body: string | null
  start_date: string | null
  end_date: string | null
  location_text: string | null
  city: string | null
  nation: Nation | null
  format: ConferenceFormat | null
  abstract_open_at: string | null
  abstract_deadline: string | null
  results_date_text: string | null
  submission_status: 'open' | 'upcoming' | 'closed'
  status_override: ListingStatus | null
  poster_accepted: boolean | null
  oral_accepted: boolean | null
  eligible_work_types: string[]
  eligible_career_levels: string[]
  abstract_word_limit: number | null
  submission_requirements: string | null
  conference_fee: string | null
  submission_fee: string | null
  prize_info: string | null
  publication_info: string | null
  recognition_level: RecognitionLevel | null
  official_page_url: string | null
  submission_page_url: string | null
  canonical_url: string | null
  poster_requirements: Record<string, unknown>
  source_type: 'staff' | 'scraped'
  source_id: string | null
  verification_confidence: number | null
  last_verified_at: string | null
  publication_status: PublicationStatus
  created_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  admin_notes: string | null
  deadline_not_stated: boolean
  created_at: string
  updated_at: string
  listing_status: ListingStatus
  specialties: ConferenceSpecialty[]
  save?: ConferenceSave | null
}

export function slugifyConferenceName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return base || 'conference'
}

export function computeListingStatus(
  opp: {
    status_override?: string | null
    end_date?: string | null
    abstract_deadline?: string | null
    abstract_open_at?: string | null
    submission_status?: string | null
    deadline_not_stated?: boolean | null
  },
  now = new Date()
): ListingStatus {
  if (opp.status_override === 'open' || opp.status_override === 'upcoming' || opp.status_override === 'closed' || opp.status_override === 'archived') {
    return opp.status_override
  }

  if (opp.end_date) {
    const end = new Date(`${opp.end_date}T23:59:59.000Z`)
    if (!Number.isNaN(end.getTime()) && end < now) return 'archived'
  }

  if (opp.abstract_deadline) {
    const deadline = new Date(opp.abstract_deadline)
    if (!Number.isNaN(deadline.getTime()) && deadline < now) return 'closed'
  }

  if (opp.abstract_open_at) {
    const opens = new Date(opp.abstract_open_at)
    if (!Number.isNaN(opens.getTime()) && opens > now) return 'upcoming'
  }

  if (opp.deadline_not_stated) return 'upcoming'
  if (opp.abstract_deadline) return 'open'
  if (opp.submission_status === 'open' || opp.submission_status === 'upcoming' || opp.submission_status === 'closed') {
    return opp.submission_status
  }
  return 'upcoming'
}

export function isVisibleInDefaultSearch(status: ListingStatus): boolean {
  return status === 'open' || status === 'upcoming'
}

export function deadlineUrgency(
  deadline: string | null | undefined,
  now = new Date()
): 'none' | 'closed' | 'urgent' | 'soon' | 'ok' {
  if (!deadline) return 'none'
  const at = new Date(deadline)
  if (Number.isNaN(at.getTime())) return 'none'
  const ms = at.getTime() - now.getTime()
  if (ms < 0) return 'closed'
  const days = ms / (1000 * 60 * 60 * 24)
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'soon'
  return 'ok'
}

export function labelFor(list: readonly { value: string; label: string }[], value?: string | null) {
  if (!value) return 'Not stated'
  return list.find((item) => item.value === value)?.label || value
}

export function isGenericListingUrl(url?: string | null) {
  if (!url) return true
  const normalised = url.trim().replace(/\/+$/, '')
  return /^https?:\/\/(www\.)?bgs\.org\.uk\/abstracts$/i.test(normalised)
}

const UK_TZ = 'Europe/London'

export function formatConferenceDate(value?: string | null): string {
  if (!value) return 'Not stated'
  const date = value.length <= 10 ? new Date(`${value}T12:00:00Z`) : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not stated'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: UK_TZ,
  })
}

export function formatDeadline(value?: string | null): string {
  if (!value) return 'Not stated'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not stated'
  const stamp = date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: UK_TZ,
  })
  return `${stamp} ${ukZoneName(date)}`
}

export function isSubmissionClosed(
  item: { submission_status?: string | null; abstract_deadline?: string | null },
  now = new Date()
) {
  if (item.submission_status === 'closed') return true
  if (!item.abstract_deadline) return false
  const deadline = new Date(item.abstract_deadline)
  return !Number.isNaN(deadline.getTime()) && deadline < now
}

export function presentationLabel(opp: { poster_accepted?: boolean | null; oral_accepted?: boolean | null }) {
  const poster = opp.poster_accepted === true
  const oral = opp.oral_accepted === true
  if (poster && oral) return 'Poster and oral'
  if (poster) return 'Poster'
  if (oral) return 'Oral'
  if (opp.poster_accepted === false && opp.oral_accepted === false) return 'Not stated'
  return 'Not stated'
}
