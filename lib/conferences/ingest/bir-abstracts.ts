import { fetchIngestText } from './fetch'
import {
  extractAnchors,
  makeOpportunity,
  parseClosingDeadline,
  parseMeetingDates,
  resolveUrl,
  slugFromMeetingName,
  visiblePageText,
  yearFromName,
  type IngestedOpportunity,
} from './types'

export const BIR_ABSTRACTS_URL = 'https://www.bir.org.uk/education-and-events/call-for-abstracts/'

const EVENT_BLOCK =
  /Date:\s+(.+?)\s+Venue:\s+(.+?)\s+Abstract Submission deadline:\s+(.+?)(?=\s+(?:The |Please |Abstracts |If |BIR |Date:)|$)/gi

function cityFromVenue(venue: string) {
  const parts = venue.split(',').map((part) => part.trim()).filter(Boolean)
  return parts[parts.length - 1] || null
}

function wordLimitFrom(text: string) {
  const match = text.match(/maximum of (\d+)\s+words/i)
  return match ? Number(match[1]) : null
}

function eventNameBefore(text: string, dateIndex: number) {
  const window = text.slice(Math.max(0, dateIndex - 100), dateIndex).trim()
  const bir = window.match(/(BIR\b[A-Za-z0-9 &'/-]*?20\d{2})$/i)
  if (bir) return bir[1].replace(/\s+/g, ' ').trim()
  const titled = window.match(/([A-Z][A-Za-z0-9 &'/-]{6,70}?20\d{2})$/)
  return titled?.[1]?.replace(/\s+/g, ' ').trim() || null
}

export function parseBirAbstractsHtml(html: string, now = new Date()): IngestedOpportunity[] {
  const text = visiblePageText(html)
  const anchors = extractAnchors(html)
  const guidelines = anchors.find((anchor) => /abstract submission guidelines|5831/i.test(`${anchor.text} ${anchor.href}`))
  const submit =
    anchors.find((anchor) => /abstract-submission-form/i.test(anchor.href)) ||
    anchors.find((anchor) => /mybir|submit abstract|eposter/i.test(`${anchor.text} ${anchor.href}`))
  const wordLimit = wordLimitFrom(text)
  const resultsMatch = text.match(/acceptance emails will be sent out by the (\d{1,2} \w+ \d{4})/i)
  const opportunities: IngestedOpportunity[] = []

  EVENT_BLOCK.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = EVENT_BLOCK.exec(text))) {
    const name = eventNameBefore(text, match.index)
    if (!name) continue

    const year = yearFromName(name) || yearFromName(match[1]) || yearFromName(match[3])
    const dates = parseMeetingDates(match[1], year)
    const deadline = parseClosingDeadline(match[3], year)
    const venue = match[2].replace(/\s+/g, ' ').trim()
    const closedByLabel = /submissions? (are )?now closed|deadline has now passed/i.test(text) && !deadline
    const closed = Boolean(deadline && deadline < now) || closedByLabel
    const slug = slugFromMeetingName(name)
    const submissionPageUrl = submit ? resolveUrl(submit.href, BIR_ABSTRACTS_URL) : BIR_ABSTRACTS_URL

    opportunities.push(
      makeOpportunity({
        name,
        organising_body: 'British Institute of Radiology',
        start_date: dates.start,
        end_date: dates.end,
        location_text: venue,
        city: cityFromVenue(venue),
        format: 'in_person',
        abstract_deadline: deadline ? deadline.toISOString() : null,
        results_date_text: resultsMatch?.[1] || null,
        submission_status: closed ? 'closed' : deadline ? 'open' : 'upcoming',
        poster_accepted: true,
        oral_accepted: /oral presentation/i.test(text),
        eligible_work_types: ['research', 'audit', 'qi', 'case_report'],
        abstract_word_limit: wordLimit,
        submission_requirements: [
          'Submit via the MyBIR portal (free account required).',
          wordLimit ? `Abstracts should be a maximum of ${wordLimit} words.` : null,
          'Educational case reports, audits and research relating to medical imaging and radiotherapy are welcome.',
          guidelines
            ? `See official abstract submission guidelines: ${resolveUrl(guidelines.href, BIR_ABSTRACTS_URL)}`
            : null,
        ]
          .filter(Boolean)
          .join(' '),
        prize_info: null,
        publication_info: /online resource|display your eposter/i.test(text)
          ? 'Accepted work is presented as an ePoster at the event and displayed as an online resource.'
          : null,
        official_page_url: BIR_ABSTRACTS_URL,
        submission_page_url: closed ? null : submissionPageUrl,
        canonical_url: `${BIR_ABSTRACTS_URL}#${slug}`,
        poster_requirements: wordLimit ? { abstract_word_limit: wordLimit } : {},
        suggested_specialty_slugs: ['radiology'],
        verification_confidence: deadline ? 0.84 : 0.68,
        ingest_payload: { source: 'bir_abstracts', deadlineText: match[3].trim(), venue },
      })
    )
  }

  return opportunities
}

export const birAbstractsAdapter = {
  key: 'bir_abstracts',
  async listOpportunities(html?: string) {
    const page = html ?? (await fetchIngestText(BIR_ABSTRACTS_URL))
    return parseBirAbstractsHtml(page)
  },
}
