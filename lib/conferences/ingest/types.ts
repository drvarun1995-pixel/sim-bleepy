import { ukEventDateTimeToUtc } from '@/lib/ukEventTime'

export type IngestedOpportunity = {
  name: string
  organising_body: string
  start_date: string | null
  end_date: string | null
  location_text: string | null
  city: string | null
  nation: string | null
  format: string | null
  abstract_open_at: string | null
  abstract_deadline: string | null
  results_date_text: string | null
  submission_status: 'open' | 'upcoming' | 'closed'
  poster_accepted: boolean | null
  oral_accepted: boolean | null
  eligible_work_types: string[]
  eligible_career_levels: string[]
  abstract_word_limit: number | null
  submission_requirements: string | null
  prize_info: string | null
  publication_info: string | null
  recognition_level: string | null
  official_page_url: string | null
  submission_page_url: string | null
  canonical_url: string
  poster_requirements: Record<string, unknown>
  suggested_specialty_slugs: string[]
  verification_confidence: number
  ingest_payload: Record<string, unknown>
}

export type ConferenceSourceAdapter = {
  key: string
  listOpportunities(html?: string): Promise<IngestedOpportunity[]>
}

export function slugFromMeetingName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

export function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractAnchors(html: string): { href: string; text: string }[] {
  const anchors: { href: string; text: string }[] = []
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html))) {
    anchors.push({
      href: match[1].replace(/&amp;/g, '&'),
      text: decodeHtml(match[2]),
    })
  }
  return anchors
}

export function visiblePageText(html: string) {
  return decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
  )
}

export function isoDateAtUkClose(date: Date | null, hours = 17, minutes = 0) {
  if (!date) return null
  const isoDate = date.toISOString().slice(0, 10)
  return ukEventDateTimeToUtc(isoDate, `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`).toISOString()
}

export function submissionStatusFor(deadline: Date | null, closedByLabel: boolean, openAt?: Date | null, now = new Date()): IngestedOpportunity['submission_status'] {
  if (closedByLabel || (deadline && deadline < now)) return 'closed'
  if (openAt && openAt > now) return 'upcoming'
  if (deadline) return 'open'
  return 'upcoming'
}

export function makeOpportunity(
  input: Partial<IngestedOpportunity> &
    Pick<IngestedOpportunity, 'name' | 'organising_body' | 'canonical_url' | 'suggested_specialty_slugs'>
): IngestedOpportunity {
  return {
    start_date: null,
    end_date: null,
    location_text: null,
    city: null,
    nation: 'uk_wide',
    format: 'in_person',
    abstract_open_at: null,
    abstract_deadline: null,
    results_date_text: null,
    submission_status: 'upcoming',
    poster_accepted: true,
    oral_accepted: true,
    eligible_work_types: ['research', 'qi', 'audit'],
    eligible_career_levels: ['anyone', 'medical_student', 'foundation_doctor', 'resident_doctor'],
    abstract_word_limit: null,
    submission_requirements: null,
    prize_info: null,
    publication_info: null,
    recognition_level: 'national',
    official_page_url: null,
    submission_page_url: null,
    poster_requirements: {},
    verification_confidence: 0.7,
    ingest_payload: {},
    ...input,
  }
}

export function extractHref(html: string): string | null {
  const match = html.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/i)
  return match?.[1] || null
}

export function resolveUrl(href: string | null | undefined, baseUrl: string): string | null {
  if (!href) return null
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return href
  }
}

export type TableCell = { text: string; href: string | null }

export function extractTableCells(html: string): TableCell[][][] {
  const tables: TableCell[][][] = []
  const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi
  let tableMatch: RegExpExecArray | null
  while ((tableMatch = tableRegex.exec(html))) {
    const rows: TableCell[][] = []
    const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
    let rowMatch: RegExpExecArray | null
    while ((rowMatch = rowRegex.exec(tableMatch[1]))) {
      const cells: TableCell[] = []
      const cellRegex = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi
      let cellMatch: RegExpExecArray | null
      while ((cellMatch = cellRegex.exec(rowMatch[1]))) {
        cells.push({
          text: decodeHtml(cellMatch[1]),
          href: extractHref(cellMatch[1]),
        })
      }
      if (cells.length) rows.push(cells)
    }
    if (rows.length) tables.push(rows)
  }
  return tables
}

export function extractTables(html: string): string[][][] {
  return extractTableCells(html).map((table) => table.map((row) => row.map((cell) => cell.text)))
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

export function parseFlexibleDate(raw: string | null | undefined, fallbackYear?: number): Date | null {
  if (!raw) return null
  const text = raw.replace(/\s+/g, ' ').trim()
  if (!text || /^closed$/i.test(text)) return null

  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const date = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const long = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (long) {
    const month = MONTHS[long[2].toLowerCase()]
    if (month == null) return null
    const date = new Date(Date.UTC(Number(long[3]), month, Number(long[1])))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const short = text.match(/(\d{1,2})\s+([A-Za-z]+)/)
  if (short && fallbackYear) {
    const month = MONTHS[short[2].toLowerCase()]
    if (month == null) return null
    const date = new Date(Date.UTC(fallbackYear, month, Number(short[1])))
    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

export function normaliseUkDatePhrase(raw: string) {
  return raw
    .replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b\.?/gi, ' ')
    .replace(/(\d{1,2})(?:st|nd|rd|th)\b/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseClosingDeadline(raw: string, fallbackYear?: number): Date | null {
  if (!raw || /closed/i.test(raw) && !/\d/.test(raw)) return null
  const date = parseFlexibleDate(raw, fallbackYear)
  if (!date) return null
  const timeMatch = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
  const gmt24 = raw.match(/(\d{1,2}):(\d{2})\s*(?:GMT|UTC)/i)
  let hours = 17
  let minutes = 0
  if (timeMatch) {
    hours = Number(timeMatch[1]) % 12
    if (timeMatch[3].toLowerCase() === 'pm') hours += 12
    minutes = Number(timeMatch[2] || 0)
  } else if (gmt24) {
    hours = Number(gmt24[1])
    minutes = Number(gmt24[2])
  }
  const clock = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  const isoDate = date.toISOString().slice(0, 10)
  if (/\b(GMT|UTC)\b/i.test(raw)) {
    date.setUTCHours(hours, minutes, 0, 0)
    return date
  }
  return ukEventDateTimeToUtc(isoDate, clock)
}

export function parseMeetingDates(raw: string, fallbackYear?: number): { start: string | null; end: string | null } {
  if (!raw) return { start: null, end: null }
  const text = normaliseUkDatePhrase(raw)
  const range = text.match(
    /(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/i
  )
  if (range) {
    const year = range[4] ? Number(range[4]) : fallbackYear
    const start = parseFlexibleDate(`${range[1]} ${range[3]} ${year || ''}`.trim(), year)
    const end = parseFlexibleDate(`${range[2]} ${range[3]} ${year || ''}`.trim(), year)
    return {
      start: start ? start.toISOString().slice(0, 10) : null,
      end: end ? end.toISOString().slice(0, 10) : null,
    }
  }
  const single = parseFlexibleDate(text, fallbackYear)
  const iso = single ? single.toISOString().slice(0, 10) : null
  return { start: iso, end: iso }
}

export function yearFromName(name: string): number | undefined {
  const match = name.match(/\b(20\d{2})\b/)
  return match ? Number(match[1]) : undefined
}
