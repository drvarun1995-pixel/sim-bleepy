export const EVENT_SERIES_MAX_OCCURRENCES = 52

export const EVENT_SERIES_SQL_HINT =
  'Repeating events need the series SQL. Run migrations/add-event-series.sql in the Supabase SQL editor, then try again.'

export type EventSeriesFrequency = 'weekly' | 'fortnightly' | 'monthly'
export type EventSeriesScope = 'this' | 'this_and_future' | 'all'

export type EventRepeatInput = {
  enabled?: boolean
  frequency: EventSeriesFrequency
  untilDate?: string | null
  count?: number | null
  skipWeekends?: boolean
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: string | null | undefined): value is string {
  return Boolean(value && ISO_DATE.test(value))
}

function parseUtcDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDaysIso(isoDate: string, days: number): string {
  const date = parseUtcDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return toIsoDate(date)
}

export function addMonthsIso(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const targetMonthIndex = month - 1 + months
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
  const clampedDay = Math.min(day, lastDay)
  return toIsoDate(new Date(Date.UTC(targetYear, normalizedMonth, clampedDay)))
}

function isWeekend(isoDate: string): boolean {
  const weekday = parseUtcDate(isoDate).getUTCDay()
  return weekday === 0 || weekday === 6
}

function shiftOffWeekend(isoDate: string): string {
  const weekday = parseUtcDate(isoDate).getUTCDay()
  if (weekday === 6) return addDaysIso(isoDate, 2)
  if (weekday === 0) return addDaysIso(isoDate, 1)
  return isoDate
}

function offsetFromStart(startDate: string, frequency: EventSeriesFrequency, index: number): string {
  if (frequency === 'weekly') return addDaysIso(startDate, 7 * index)
  if (frequency === 'fortnightly') return addDaysIso(startDate, 14 * index)
  return addMonthsIso(startDate, index)
}

export function generateSeriesDates(startDate: string, repeat: EventRepeatInput): string[] {
  if (!isIsoDate(startDate)) return []

  const untilDate = isIsoDate(repeat.untilDate || '') ? repeat.untilDate! : null
  const requestedCount =
    typeof repeat.count === 'number' && Number.isFinite(repeat.count)
      ? Math.floor(repeat.count)
      : null

  if (!untilDate && (!requestedCount || requestedCount < 2)) {
    return [startDate]
  }

  const maxCount = Math.min(
    EVENT_SERIES_MAX_OCCURRENCES,
    requestedCount && requestedCount > 0 ? requestedCount : EVENT_SERIES_MAX_OCCURRENCES
  )

  const dates: string[] = []
  const seen = new Set<string>()

  for (let index = 0; index < EVENT_SERIES_MAX_OCCURRENCES * 3 && dates.length < maxCount; index += 1) {
    const raw = offsetFromStart(startDate, repeat.frequency, index)
    const occurrence = repeat.skipWeekends ? shiftOffWeekend(raw) : raw
    if (untilDate && occurrence > untilDate) break
    if (!seen.has(occurrence)) {
      dates.push(occurrence)
      seen.add(occurrence)
    }
  }

  return dates
}

export function formatSeriesDatePreview(isoDate: string): string {
  if (!isIsoDate(isoDate)) return isoDate
  const date = parseUtcDate(isoDate)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function seriesFrequencyLabel(frequency: EventSeriesFrequency): string {
  if (frequency === 'weekly') return 'weekly'
  if (frequency === 'fortnightly') return 'fortnightly'
  return 'monthly'
}

export const SERIES_COLUMN_OMIT_ON_SIBLINGS = [
  'id',
  'date',
  'created_at',
  'updated_at',
  'series_id',
  'series_index',
  'author_id',
  'author_name',
  'attendees',
] as const
