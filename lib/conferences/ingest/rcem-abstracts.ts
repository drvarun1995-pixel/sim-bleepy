import { fetchIngestText } from './fetch'
import {
  extractAnchors,
  makeOpportunity,
  parseMeetingDates,
  resolveUrl,
  slugFromMeetingName,
  visiblePageText,
  yearFromName,
  type IngestedOpportunity,
} from './types'

export const RCEM_HUB_URL = 'https://rcem.ac.uk/flagship/abstract-submissions/'

const EVENT_LINE =
  /([A-Za-z0-9][A-Za-z0-9 ,/'()+.-]{3,80}?)\s*(?:\||–|-)\s*((?:\d{1,2}\s*(?:-|–|to)\s*)?\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?)/g

function bestHrefForName(name: string, anchors: { href: string; text: string }[]) {
  const normalised = name.toLowerCase()
  const match = anchors.find((anchor) => {
    if (!anchor.text) return false
    const text = anchor.text.toLowerCase()
    return text === normalised || normalised.includes(text) || text.includes(normalised)
  })
  return match ? resolveUrl(match.href, RCEM_HUB_URL) : RCEM_HUB_URL
}

export function parseRcemAbstractsHtml(html: string): IngestedOpportunity[] {
  const text = visiblePageText(html)
  const sectionMatch = text.match(
    /Abstract submissions are now open for the following events:([\s\S]{0,1200}?)(?:Click here to register|FAQs|Can I submit)/i
  )
  const slice = sectionMatch?.[1] || text
  const anchors = extractAnchors(html).filter((anchor) =>
    /\/(virtual-events|face-to-face-events|annual-conference)/i.test(anchor.href)
  )

  const opportunities: IngestedOpportunity[] = []
  let match: RegExpExecArray | null
  EVENT_LINE.lastIndex = 0
  while ((match = EVENT_LINE.exec(slice))) {
    const name = match[1].replace(/\s+/g, ' ').trim()
    if (/register your details|click here/i.test(name)) continue
    const year = yearFromName(match[2]) || yearFromName(name) || yearFromName(slice)
    const dates = parseMeetingDates(match[2], year)
    const official = bestHrefForName(name, anchors)
    opportunities.push(
      makeOpportunity({
        name: name.startsWith('RCEM') ? name : `RCEM ${name}`,
        organising_body: 'Royal College of Emergency Medicine',
        start_date: dates.start,
        end_date: dates.end,
        format: /virtual|study day|educators/i.test(name) ? 'virtual' : 'in_person',
        recognition_level: /annual conference/i.test(name) ? 'national' : 'national',
        submission_status: 'open',
        official_page_url: official,
        submission_page_url: RCEM_HUB_URL,
        canonical_url: `${RCEM_HUB_URL}#${slugFromMeetingName(name)}`,
        suggested_specialty_slugs: ['emergency-medicine'],
        verification_confidence: 0.72,
        ingest_payload: { source: 'rcem_abstracts', dateText: match[2] },
      })
    )
  }
  return opportunities
}

export const rcemAbstractsAdapter = {
  key: 'rcem_abstracts',
  async listOpportunities(html?: string) {
    const page = html ?? (await fetchIngestText(RCEM_HUB_URL))
    return parseRcemAbstractsHtml(page)
  },
}
