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
  type IngestedOpportunity,
} from './types'

export const RCPCH_FAQ_URL = 'https://www.rcpch.ac.uk/news-events/rcpch-conference/abstract-FAQs-2026'
export const RCPCH_GUIDELINES_URL = 'https://www.rcpch.ac.uk/news-events/rcpch-conference/abstract-guidelines'
export const RCPCH_HUB_URL = 'https://www.rcpch.ac.uk/news-events/rcpch-conference'

export function parseRcpchConferenceHtml(faqHtml: string, guidelinesHtml = ''): IngestedOpportunity[] {
  const text = `${visiblePageText(faqHtml)}\n${visiblePageText(guidelinesHtml)}`
  const year =
    Number(text.match(/for the (\d{4}) Conference/i)?.[1] || 0) ||
    Math.max(
      ...Array.from(text.matchAll(/RCPCH Conference (\d{4})/gi)).map((match) => Number(match[1])),
      0
    ) ||
    2027
  const dates = parseMeetingDates(
    text.match(/takes place from ([^.]+?)(?: at |\.)/i)?.[1] ||
      text.match(/(\d{1,2}\s+to\s+\d{1,2}\s+[A-Za-z]+\s+\d{4})/)?.[1] ||
      '',
    year
  )
  const venueMatch = text.match(/at the ([^.]+?)(?:\.|Abstract)/i)
  const openMatch = text.match(/open from \w+day (\d{1,2} \w+ \d{4}) until (\d{1,2} \w+ \d{4})/i)
  const deadlineMatch =
    text.match(/remain open until \w+day (\d{1,2} \w+)[^\d]{0,20}(\d{1,2})[.:](\d{2})\s*\(BST\)/i) ||
    text.match(/until \w+day (\d{1,2} \w+ \d{4})/i) ||
    text.match(/deadline[^\n]{0,40}?(\d{1,2} \w+ \d{4})/i)
  const wordLimit = Number(text.match(/should not exceed (\d+) words/i)?.[1] || text.match(/(\d+) words/i)?.[1] || 0) || 470

  const openAt = openMatch ? parseFlexibleDate(openMatch[1], year) : parseFlexibleDate('2 July 2026', year)
  const closeRaw = openMatch?.[2] || deadlineMatch?.[1] || '6 September 2026'
  const deadlineDate = parseFlexibleDate(closeRaw, year)
  const deadline = isoDateAtUkClose(deadlineDate, 23, 59)
  const closedByLabel = /abstract submissions are now closed/i.test(text) && !/open from \w+day \d{1,2} \w+ \d{4} until/i.test(text)

  const anchors = extractAnchors(`${faqHtml}\n${guidelinesHtml}`)
  const submit = anchors.find((anchor) => /oxfordabstracts|submit your abstract|stages\/\d+\/submitter/i.test(`${anchor.href} ${anchor.text}`))
  const guidelines = anchors.find((anchor) => /abstract-guidelines/i.test(anchor.href))

  return [
    makeOpportunity({
      name: `RCPCH Conference ${year}`,
      organising_body: 'Royal College of Paediatrics and Child Health',
      start_date: dates.start,
      end_date: dates.end,
      location_text: venueMatch?.[1]?.replace(/\s+/g, ' ').trim() || 'LEX Liverpool',
      city: /liverpool/i.test(text) ? 'Liverpool' : null,
      format: 'in_person',
      abstract_open_at: openAt ? isoDateAtUkClose(openAt, 0, 0) : null,
      abstract_deadline: deadline,
      results_date_text: text.match(/Notification[^\n]{0,40}?(\d{1,2} \w+ \d{4})/i)?.[1] || '27 November 2026',
      submission_status: submissionStatusFor(deadline ? new Date(deadline) : null, closedByLabel, openAt),
      abstract_word_limit: wordLimit,
      submission_requirements:
        'Maximum 470 words plus 130 for references. Use Aims, Methods, Results and Conclusion. Blind review: no author or hospital names in the abstract body. Title maximum 160 characters.',
      publication_info: 'Accepted abstracts are published in an Archives of Disease in Childhood supplement.',
      official_page_url: resolveUrl(guidelines?.href, RCPCH_HUB_URL) || RCPCH_FAQ_URL,
      submission_page_url: submit ? resolveUrl(submit.href, RCPCH_HUB_URL) : 'https://app.oxfordabstracts.com/auth?redirect=/stages/82675/submitter',
      canonical_url: `${RCPCH_HUB_URL}#${year}`,
      poster_requirements: {
        abstract_word_limit: wordLimit,
        reference_word_limit: 130,
        title_character_limit: 160,
        headings: ['Aims', 'Methods', 'Results', 'Conclusion'],
      },
      suggested_specialty_slugs: ['paediatrics'],
      verification_confidence: deadline ? 0.84 : 0.68,
      ingest_payload: { source: 'rcpch_conference', year },
    }),
  ]
}

export const rcpchConferenceAdapter = {
  key: 'rcpch_conference',
  async listOpportunities(html?: string) {
    const faq = html ?? (await fetchIngestText(RCPCH_FAQ_URL))
    const guidelines = html ? '' : (await fetchIngestTextOptional(RCPCH_GUIDELINES_URL)) || ''
    return parseRcpchConferenceHtml(faq, guidelines)
  },
}
