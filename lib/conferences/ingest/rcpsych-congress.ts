import { fetchIngestText, fetchIngestTextOptional } from './fetch'
import {
  extractAnchors,
  isoDateAtUkClose,
  makeOpportunity,
  parseFlexibleDate,
  parseMeetingDates,
  resolveUrl,
  submissionStatusFor,
  visiblePageText,
  yearFromName,
  type IngestedOpportunity,
} from './types'

export const RCPSYCH_CONGRESS_URL = 'https://www.rcpsych.ac.uk/events/congress'
export const RCPSYCH_FAQS_URL = 'https://www.rcpsych.ac.uk/events/congress/congress-faqs'
export const RCPSYCH_POSTER_URL = 'https://www.rcpsych.ac.uk/events/congress/poster-presentations-2026'
export const RCPSYCH_GUIDANCE_URL =
  'https://www.rcpsych.ac.uk/events/congress/poster-presentations-2026/poster-submission-guidance'

export function parseRcpsychCongressHtml(faqHtml: string, posterHtml = '', guidanceHtml = ''): IngestedOpportunity[] {
  const text = `${visiblePageText(faqHtml)}\n${visiblePageText(posterHtml)}\n${visiblePageText(guidanceHtml)}`
  const anchors = extractAnchors(`${faqHtml}\n${posterHtml}\n${guidanceHtml}`)
  const submit = anchors.find((anchor) => /oxfordabstracts|stages\/\d+/i.test(anchor.href))
  const year = yearFromName(text.match(/International Congress (\d{4})/i)?.[0] || '') || 2026
  const dates = parseMeetingDates(
    text.match(/taking place[^\d]{0,40}(\d{1,2}\s*(?:–|-|to)\s*\d{1,2} \w+ \d{4})/i)?.[1] ||
      text.match(/from \w+day (\d{1,2}\s*(?:–|-|to)\s*\w+day \d{1,2} \w+ \d{4})/i)?.[1] ||
      '15-18 June 2026',
    year
  )
  const deadlineDate =
    parseFlexibleDate(text.match(/deadline[^\n]{0,80}?(\d{1,2} \w+ \d{4})/i)?.[1] || '', year) ||
    parseFlexibleDate('6 February 2026')
  const closed = /poster submissions?[\s\S]{0,40}are now closed|submission deadline has now passed|now closed/i.test(text)
  const deadline = isoDateAtUkClose(deadlineDate, 17, 0)
  const items: IngestedOpportunity[] = [
    makeOpportunity({
      name: `RCPsych International Congress ${year}`,
      organising_body: 'Royal College of Psychiatrists',
      start_date: dates.start,
      end_date: dates.end,
      city: /liverpool/i.test(text) ? 'Liverpool' : null,
      location_text: /ACC Liverpool/i.test(text) ? 'ACC Liverpool' : null,
      format: 'in_person',
      abstract_deadline: deadline,
      submission_status: submissionStatusFor(deadline ? new Date(deadline) : null, closed),
      official_page_url: RCPSYCH_CONGRESS_URL,
      submission_page_url: closed ? null : submit ? resolveUrl(submit.href, RCPSYCH_CONGRESS_URL) : RCPSYCH_POSTER_URL,
      canonical_url: `${RCPSYCH_CONGRESS_URL}#${year}`,
      suggested_specialty_slugs: ['psychiatry'],
      verification_confidence: 0.78,
      ingest_payload: { source: 'rcpsych_congress', year },
    }),
  ]

  if (/International Congress 2027 open later/i.test(text) || /submissions for international congress 2027/i.test(text)) {
    items.push(
      makeOpportunity({
        name: 'RCPsych International Congress 2027',
        organising_body: 'Royal College of Psychiatrists',
        submission_status: 'upcoming',
        official_page_url: RCPSYCH_CONGRESS_URL,
        canonical_url: `${RCPSYCH_CONGRESS_URL}#2027`,
        suggested_specialty_slugs: ['psychiatry'],
        verification_confidence: 0.55,
        ingest_payload: { source: 'rcpsych_congress', year: 2027, deadlineNotStated: true },
      })
    )
  }

  return items
}

export const rcpsychCongressAdapter = {
  key: 'rcpsych_congress',
  async listOpportunities(html?: string) {
    const faqs = html ?? (await fetchIngestText(RCPSYCH_FAQS_URL))
    const poster = html ? '' : (await fetchIngestTextOptional(RCPSYCH_POSTER_URL)) || ''
    const guidance = html ? '' : (await fetchIngestTextOptional(RCPSYCH_GUIDANCE_URL)) || ''
    return parseRcpsychCongressHtml(faqs, poster, guidance)
  },
}
