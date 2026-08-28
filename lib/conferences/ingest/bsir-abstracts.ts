import { fetchIngestText } from './fetch'
import {
  makeOpportunity,
  parseMeetingDates,
  visiblePageText,
  yearFromName,
  type IngestedOpportunity,
} from './types'

export const BSIR_ABSTRACTS_URL = 'https://www.bsirmeeting.org/submit/abstract-submission/'

export function parseBsirAbstractsHtml(html: string): IngestedOpportunity[] {
  const text = visiblePageText(html)
  const year = yearFromName(text.match(/BSIR (\d{4})/i)?.[0] || '') || yearFromName(text) || new Date().getUTCFullYear()
  const dateMatch = text.match(/(\d{1,2}(?:st|nd|rd|th)?\s*[–-]\s*\d{1,2}(?:st|nd|rd|th)?\s+\w+)(?:\s+\d{4})?/i)
  const dates = parseMeetingDates(`${dateMatch?.[1] || ''} ${year}`.trim(), year)
  const closed = /abstract submission for BSIR \d{4} has ended|submissions? (are )?now closed|submission has ended/i.test(text)
  const city = /birmingham/i.test(text) ? 'Birmingham' : null

  return [
    makeOpportunity({
      name: `BSIR Annual Scientific Meeting ${year}`,
      organising_body: 'British Society of Interventional Radiology',
      start_date: dates.start,
      end_date: dates.end,
      location_text: city ? `${city}, UK` : null,
      city,
      format: 'in_person',
      abstract_deadline: null,
      results_date_text: /notifications[\s\S]{0,40}mid-June/i.test(text) ? 'mid-June' : null,
      submission_status: closed ? 'closed' : 'upcoming',
      poster_accepted: true,
      oral_accepted: true,
      eligible_work_types: ['research', 'qi', 'audit', 'case_report'],
      submission_requirements: [
        'Scientific abstracts may be considered for oral or electronic poster presentation; educational abstracts are presented as electronic posters.',
        'Presenting authors of accepted work must register and attend.',
      ].join(' '),
      prize_info: /Poster Awards|Best Scientific Paper Presentation Awards/i.test(text)
        ? 'Poster prizes (certificate and £50 Amazon voucher) and scientific presentation awards including Best Overall, Best Trainee, Best Juniors, and the Robert Bardsley Award (up to £750 meeting-expense reimbursement).'
        : null,
      publication_info: /published in a special supplement of CVIR/i.test(text)
        ? 'Accepted abstracts are published in a special supplement of CVIR.'
        : null,
      official_page_url: BSIR_ABSTRACTS_URL,
      submission_page_url: closed ? null : BSIR_ABSTRACTS_URL,
      canonical_url: `${BSIR_ABSTRACTS_URL}#bsir-${year}`,
      suggested_specialty_slugs: ['radiology'],
      verification_confidence: closed ? 0.86 : 0.62,
      ingest_payload: { source: 'bsir_abstracts', year, deadlineNotStated: true },
    }),
  ]
}

export const bsirAbstractsAdapter = {
  key: 'bsir_abstracts',
  async listOpportunities(html?: string) {
    const page = html ?? (await fetchIngestText(BSIR_ABSTRACTS_URL))
    return parseBsirAbstractsHtml(page)
  },
}
