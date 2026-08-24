import { isGenericListingUrl } from '@/lib/conferences'
import {
  extractTableCells,
  parseClosingDeadline,
  parseFlexibleDate,
  parseMeetingDates,
  resolveUrl,
  slugFromMeetingName,
  yearFromName,
  type IngestedOpportunity,
  type TableCell,
} from './types'

export const BGS_HUB_URL = 'https://www.bgs.org.uk/abstracts'
const HUB_URL = BGS_HUB_URL

function isOpenSubmissionUrl(href: string | null, label: string) {
  if (!href || isGenericListingUrl(href)) return false
  if (/submissions closed/i.test(label)) return false
  return /abstract-submission|eid=|submit/i.test(href) || /submit abstracts/i.test(label)
}

const SHARED_REQUIREMENTS = [
  'Original research and clinical quality studies accepted; case reports are not accepted.',
  'Maximum 300 words in the abstract body; title up to 128 characters.',
  'Authors do not need to be BGS members.',
  'Scientific abstracts use Introduction / Methods / Results / Conclusions.',
  'Clinical quality abstracts should follow SQUIRE 2.0 and QI/audit criteria.',
].join(' ')

const PRIZE_INFO =
  'Prizes for best poster and platform in Clinical Quality, Nurses and AHPs, and Research at BGS conferences. Consultants or equivalent are not eligible. Richard Dodds Memorial Prize at national Spring/Autumn meetings.'

const PUBLICATION_INFO =
  'From 2026, presented posters and abstracts are assigned a DOI. Age and Ageing Spring/Autumn supplements ended after 2025.'

function inferNation(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('scotland')) return 'scotland'
  if (lower.includes('wales')) return 'wales'
  if (lower.includes('northern ireland') || lower.includes(' n.i')) return 'ni'
  if (
    lower.includes('midlands') ||
    lower.includes('yorkshire') ||
    lower.includes('north west') ||
    lower.includes('north east') ||
    lower.includes('london') ||
    lower.includes('south west') ||
    lower.includes('south east') ||
    lower.includes('east of england')
  ) {
    return 'england'
  }
  return 'uk_wide'
}

function inferRecognition(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('region') || lower.includes('midlands') || lower.includes('yorkshire') || lower.includes('north west') || lower.includes('north east')) {
    return 'regional'
  }
  if (lower.includes('scotland') || lower.includes('wales')) return 'national'
  return 'national'
}

function isSymposiumRow(name: string) {
  return /symposi/i.test(name)
}

function headerIndex(header: string[], ...needles: string[]) {
  return header.findIndex((cell) => needles.some((needle) => cell.toLowerCase().includes(needle)))
}

export function parseBgsAbstractsHtml(html: string): IngestedOpportunity[] {
  const tables = extractTableCells(html)
  const table = tables.find((rows) => {
    const header = (rows[0] || []).map((cell) => cell.text.toLowerCase())
    return header.some((cell) => cell.includes('meeting')) && header.some((cell) => cell.includes('closing') || cell.includes('deadline'))
  })
  if (!table || table.length < 2) return []

  const header = table[0]
  const headerTexts = header.map((cell) => cell.text)
  const meetingIdx = headerIndex(headerTexts, 'meeting')
  const openIdx = headerIndex(headerTexts, 'submission open', 'open')
  const closeIdx = headerIndex(headerTexts, 'closing', 'deadline', 'close')
  const resultsIdx = headerIndex(headerTexts, 'result')
  const datesIdx = headerIndex(headerTexts, 'meeting date', 'dates')
  const linkIdx = headerIndex(headerTexts, 'submission link')

  const opportunities: IngestedOpportunity[] = []

  for (const row of table.slice(1)) {
    const meetingCell = row[meetingIdx] || ({ text: '', href: null } satisfies TableCell)
    const name = meetingCell.text
    if (!name || isSymposiumRow(name)) continue

    const closeCell = closeIdx >= 0 ? row[closeIdx] : undefined
    const openCell = openIdx >= 0 ? row[openIdx] : undefined
    const datesCell = datesIdx >= 0 ? row[datesIdx] : undefined
    const linkCell = linkIdx >= 0 ? row[linkIdx] : undefined
    const resultsCell = resultsIdx >= 0 ? row[resultsIdx] : undefined
    const year = yearFromName(name) || yearFromName(datesCell?.text || '') || yearFromName(closeCell?.text || '')
    const closeRaw = closeCell?.text || ''
    const openRaw = openCell?.text || ''
    const submissionRaw = (linkCell?.text || '').toLowerCase()
    const closedByLabel = /closed/.test(closeRaw.toLowerCase()) || /submissions closed/.test(submissionRaw)
    const deadline = parseClosingDeadline(closeRaw, year)
    const openAt = parseFlexibleDate(openRaw, year)
    const dates = parseMeetingDates(datesCell?.text || '', year)
    const slug = slugFromMeetingName(name)

    let submissionStatus: IngestedOpportunity['submission_status'] = 'upcoming'
    if (closedByLabel || (deadline && deadline < new Date())) submissionStatus = 'closed'
    else if (deadline) submissionStatus = 'open'

    const officialPageUrl = resolveUrl(meetingCell.href, HUB_URL)
    const submissionHref = resolveUrl(linkCell?.href, HUB_URL)
    const submissionPageUrl = isOpenSubmissionUrl(submissionHref, linkCell?.text || '') ? submissionHref : null

    opportunities.push({
      name,
      organising_body: 'British Geriatrics Society',
      start_date: dates.start,
      end_date: dates.end,
      location_text: null,
      city: null,
      nation: inferNation(name),
      format: 'hybrid',
      abstract_open_at: openAt ? new Date(Date.UTC(openAt.getUTCFullYear(), openAt.getUTCMonth(), openAt.getUTCDate(), 0, 0, 0)).toISOString() : null,
      abstract_deadline: deadline ? deadline.toISOString() : null,
      results_date_text: resultsCell?.text || null,
      submission_status: submissionStatus,
      poster_accepted: true,
      oral_accepted: true,
      eligible_work_types: ['research', 'qi', 'audit'],
      eligible_career_levels: ['anyone', 'medical_student', 'foundation_doctor', 'resident_doctor'],
      abstract_word_limit: 300,
      submission_requirements: SHARED_REQUIREMENTS,
      prize_info: PRIZE_INFO,
      publication_info: PUBLICATION_INFO,
      recognition_level: inferRecognition(name),
      official_page_url: officialPageUrl && !isGenericListingUrl(officialPageUrl) ? officialPageUrl : null,
      submission_page_url: submissionPageUrl,
      canonical_url: `${HUB_URL}#${slug}`,
      poster_requirements: {
        abstract_word_limit: 300,
        title_character_limit: 128,
        headings: ['Introduction', 'Methods', 'Results', 'Conclusions'],
        case_reports_accepted: false,
      },
      suggested_specialty_slugs: ['geriatrics'],
      verification_confidence: deadline ? 0.86 : 0.7,
      ingest_payload: {
        source: 'bgs_abstracts',
        official_page_url: officialPageUrl,
        submission_page_url: submissionPageUrl,
        closedByLabel,
      },
    })
  }

  return opportunities
}

export async function fetchBgsAbstractsHtml(): Promise<string> {
  const response = await fetch(HUB_URL, {
    headers: {
      'User-Agent': 'BleepyConferenceIngest/1.0 (local development; +https://bleepy.co.uk)',
      Accept: 'text/html',
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`BGS fetch failed: ${response.status}`)
  }
  return response.text()
}

export const bgsAbstractsAdapter = {
  key: 'bgs_abstracts',
  async listOpportunities(html?: string) {
    const page = html ?? (await fetchBgsAbstractsHtml())
    return parseBgsAbstractsHtml(page)
  },
}
