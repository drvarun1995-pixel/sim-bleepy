import { fetchIngestText } from './fetch'
import {
  extractAnchors,
  isoDateAtUkClose,
  makeOpportunity,
  parseFlexibleDate,
  parseMeetingDates,
  resolveUrl,
  submissionStatusFor,
  visiblePageText,
  type IngestedOpportunity,
} from './types'

export const BSR_CONFERENCE_URL = 'https://www.rheumatology.org.uk/events-learning/conferences/annualconference'

export function parseBsrAnnualHtml(html: string, now = new Date()): IngestedOpportunity[] {
  const text = visiblePageText(html)
  const anchors = extractAnchors(html)
  const submit = anchors.find((anchor) => /submit for 2027|abstractsonline|targetMod=submit/i.test(`${anchor.text} ${anchor.href}`))
  const guidelines = anchors.find((anchor) => /abstract-guidelines/i.test(anchor.href))

  const windowMatch = text.match(/Submissions open from (\d{1,2} \w+)(?:\s+\d{4})?\s*(?:-|–|to)\s*(\d{1,2} \w+ \d{4})/i)
  const eventMatch = text.match(/BSR27 will take place (\d{1,2}\s*(?:–|-|to)\s*\d{1,2} \w+ \d{4}) at the ([^.]+)/i)
  const dates = parseMeetingDates(eventMatch?.[1] || '28-30 April 2027', 2027)
  const openAt = windowMatch ? parseFlexibleDate(windowMatch[1] + ' 2026', 2026) : parseFlexibleDate('13 August 2026')
  const deadlineDate = windowMatch ? parseFlexibleDate(windowMatch[2], 2026) : parseFlexibleDate('15 October 2026')
  const deadline = isoDateAtUkClose(deadlineDate, 23, 59)
  const closed = /abstract submission for BSR27 is now closed/i.test(text)

  return [
    makeOpportunity({
      name: 'BSR Annual Conference 2027',
      organising_body: 'British Society for Rheumatology',
      start_date: dates.start,
      end_date: dates.end,
      location_text: eventMatch?.[2]?.trim() || 'Liverpool Experience Campus',
      city: 'Liverpool',
      format: 'hybrid',
      abstract_open_at: openAt ? isoDateAtUkClose(openAt, 0, 0) : null,
      abstract_deadline: deadline,
      submission_status: submissionStatusFor(deadline ? new Date(deadline) : null, closed, openAt, now),
      official_page_url: BSR_CONFERENCE_URL,
      submission_page_url: submit ? resolveUrl(submit.href, BSR_CONFERENCE_URL) : null,
      canonical_url: `${BSR_CONFERENCE_URL}#bsr27`,
      submission_requirements: guidelines
        ? `See official abstract guidelines: ${resolveUrl(guidelines.href, BSR_CONFERENCE_URL)}`
        : null,
      suggested_specialty_slugs: ['rheumatology'],
      verification_confidence: 0.82,
      ingest_payload: { source: 'bsr_annual_conference', event: 'BSR27' },
    }),
  ]
}

export const bsrAnnualAdapter = {
  key: 'bsr_annual_conference',
  async listOpportunities(html?: string) {
    const page = html ?? (await fetchIngestText(BSR_CONFERENCE_URL))
    return parseBsrAnnualHtml(page)
  },
}
